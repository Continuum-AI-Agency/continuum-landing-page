"use client";

import React, { useCallback, useId, useMemo, useState } from "react";

interface InteractiveGridPatternProps {
    width?: number;
    height?: number;
    squares?: [number, number];
    className?: string;
    squaresClassName?: string;
}

export function InteractiveGridPattern({
    width = 40,
    height = 40,
    squares = [24, 24],
    className,
    squaresClassName,
}: InteractiveGridPatternProps) {
    const id = useId();
    const [hoveredSquares, setHoveredSquares] = useState<Set<string>>(new Set());

    const brandColors = useMemo(
        () => ["#0fb5a8", "#853bf4", "#2ec070"],
        []
    );

    const getRandomColor = useCallback(() => {
        return brandColors[Math.floor(Math.random() * brandColors.length)];
    }, [brandColors]);

    const handleMouseEnter = useCallback((key: string) => {
        setHoveredSquares((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);

    const handleMouseLeave = useCallback((key: string) => {
        setHoveredSquares((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    const [numColumns, numRows] = squares;

    const squareElements = useMemo(() => {
        const elements = [];
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numColumns; col++) {
                const key = `${col}-${row}`;
                elements.push(
                    <rect
                        key={key}
                        x={col * width}
                        y={row * height}
                        width={width - 1}
                        height={height - 1}
                        rx={4}
                        className={squaresClassName}
                        fill="transparent"
                        strokeWidth={0}
                        onMouseEnter={() => handleMouseEnter(key)}
                        onMouseLeave={() => handleMouseLeave(key)}
                        style={{
                            cursor: "pointer",
                            transition: "fill 0.3s ease, opacity 0.3s ease",
                        }}
                    />
                );
            }
        }
        return elements;
    }, [numColumns, numRows, width, height, squaresClassName, handleMouseEnter, handleMouseLeave]);

    // Create active squares overlay
    const activeSquares = useMemo(() => {
        return Array.from(hoveredSquares).map((key) => {
            const [col, row] = key.split("-").map(Number);
            const color = getRandomColor();
            return (
                <rect
                    key={`active-${key}`}
                    x={col * width}
                    y={row * height}
                    width={width - 1}
                    height={height - 1}
                    rx={4}
                    fill={color}
                    opacity={0.15}
                    style={{
                        transition: "opacity 0.5s ease",
                    }}
                />
            );
        });
    }, [hoveredSquares, width, height, getRandomColor]);

    return (
        <svg
            className={className}
            aria-hidden="true"
            style={{
                pointerEvents: "auto",
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
            }}
        >
            <defs>
                <pattern
                    id={`grid-${id}`}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d={`M ${width} 0 L 0 0 0 ${height}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        strokeOpacity={0.07}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
            {squareElements}
            {activeSquares}
        </svg>
    );
}
