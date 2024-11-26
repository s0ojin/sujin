"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import decomp from "poly-decomp";

export default function Page() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.decomp = decomp;

    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Svg = Matter.Svg;

    const engine = Engine.create();
    engine.gravity.y = 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current!,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#f4f4f4",
      },
    });

    const svgPaths = [
      "/assets/S.svg",
      "/assets/U.svg",
      "/assets/J.svg",
      "/assets/I.svg",
      "/assets/N.svg",
    ];

    const svgColors = ["#8573fb", "#f857b0", "#ffcd2a", "#52a4f7", "#a4e90f"];

    let colorIndex = 0;
    const getNextColor = () => {
      const color = svgColors[colorIndex];
      colorIndex = (colorIndex + 1) % svgColors.length; // 순환
      return color;
    };

    const loadSVG = async (path: string, x: number, y: number) => {
      const response = await fetch(path);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const paths = svgDoc.querySelectorAll("path");

      paths.forEach((pathElement) => {
        const vertices = Svg.pathToVertices(pathElement, 50);
        const color = getNextColor();
        const body = Bodies.fromVertices(x, y, vertices, {
          render: {
            fillStyle: color,
            strokeStyle: color,
            lineWidth: 1,
          },
        });

        const mouse = Matter.Mouse.create(render.canvas),
          mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
              stiffness: 0.2,
              damping: 2,
              render: {
                visible: false,
              },
            },
          });

        Matter.Body.scale(body, 0.3, 0.3);
        Composite.add(engine.world, [body, mouseConstraint]);
      });
    };

    const dropRandomSVG = () => {
      const randomSVG = svgPaths[Math.floor(Math.random() * svgPaths.length)];
      const x = Math.random() * width;
      const y = -100;
      loadSVG(randomSVG, x, y);
    };

    let dropCount = 0;
    const maxDrops = 20;

    const dropInterval = setInterval(() => {
      if (dropCount >= maxDrops) {
        clearInterval(dropInterval);
      } else {
        dropRandomSVG();
        dropCount++;
      }
    }, 500);

    const ground = Bodies.rectangle(width / 2, height, width, 10, {
      isStatic: true,
      render: { visible: false },
    });

    const leftWall = Bodies.rectangle(-1, height / 2, 20, height, {
      isStatic: true,
      render: { visible: false },
    });

    const rightWall = Bodies.rectangle(width + 1, height / 2, 20, height, {
      isStatic: true,
      render: { visible: false },
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: window.innerWidth, y: window.innerHeight },
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, true);
      Engine.clear(engine);
      clearInterval(dropInterval);
    };
  }, []);

  return <div ref={sceneRef}></div>;
}
