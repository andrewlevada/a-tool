"use client"

import Image from "next/image";
import { CSSProperties, useEffect, useState } from "react";
import Handsfree from 'handsfree'
import testImage from "../public/landscape.jpeg"

export default function Home() {
  // const [mode, setMode] = useState<"debug" | "default">(() => "debug")
  const [left, setLeft] = useState(() => [0, 0])
  const [right, setRight] = useState(() => [0, 0])
  const [face, setFace] = useState(() => [0, 0])

  

  

  useEffect(() => {
    const handsfree = new Handsfree({
      facemesh: true
    })

    handsfree.start()

    document.addEventListener('handsfree-data', (_ => {
      const landmarks = handsfree.data.facemesh?.multiFaceLandmarks
      if (!landmarks) return

      const faceLandmarks = landmarks[0]

      const leftL = faceLandmarks[362]
      const rightL = faceLandmarks[33]
      const faceL = { x: (rightL.x + leftL.x) / 2 , y: (rightL.y + leftL.y) / 2 }

      setLeft([1 - leftL.x, leftL.y]) // 1- because the webcam is mirrored
      setRight([1 - rightL.x, rightL.y]) // 1- because the webcam is mirrored
      setFace([1 - faceL.x, faceL.y])

      const distance = right[0] - left[0]
      console.log(distance)
    }))
  }, [])

  return (
    <div className="w-dvw h-dvh" style={{ transform: "scale(1)"}}>
      <Image src={testImage} alt="tets image" className="w-[512px] h-auto m-auto"/>

      <p className="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style={coordToPositionClass(left)}>L</p>
      <p className="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style={coordToPositionClass(right)}>R</p>
      <p className="absolute text-[#0f0] text-center text-[32px] -translate-1/2" style={coordToPositionClass(face)}>nose</p>
    </div>
  );
}

function coordToPositionClass(point: number[]): CSSProperties {
  return ({
    left: toScreen(point[0], "w"),
    top: toScreen(point[1], "h")
  })
}

function toScreen(p: number, type: "w" | "h"): string {
  if (typeof window === "undefined") return `-10px`
  const length = (type === "w" ? window.innerWidth : window.innerHeight)
  return `${length * p}px`
}
