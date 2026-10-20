"use client"

import Image from "next/image";
import { CSSProperties, useEffect, useState } from "react";
import Handsfree from 'handsfree'
import testImage from "../public/landscape.jpeg"
import { Landmarks } from "./landmarks";
import { useLandmarksQueue } from "./queue";

const factorForScale = 0.9
const factorForWidth = 0.9

export default function Home() {
  const [mode, setMode] = useState<"debug" | "default">(() => "debug")
  const [first, prev, now, push] = useLandmarksQueue()

  useEffect(() => {
    const handsfree = new Handsfree({
      facemesh: true
    })

    handsfree.start()

    document.addEventListener('handsfree-data', (_ => {
      const landmarks = handsfree.data.facemesh?.multiFaceLandmarks
      if (!landmarks) return
      push(Landmarks.fromMesh(landmarks))
    }))
  }, [])

  if (!now || !first) return(
    <div>loading...</div>
  )

  return (
    <div className="w-dvw h-dvh" style={{
      transform: `
        scale(${1 - factorForScale + (now.distanceBetweenEyes() / first.distanceBetweenEyes()) * factorForScale})
        translateX(${(now.nose()[0] - first.nose()[0]) * 100 * factorForWidth}%)
        translateY(${(now.nose()[1] - first.nose()[1]) * 100 * factorForWidth}%)
      `
    }}>
      
      <Image src={testImage} alt="tets image" className="w-[512px] h-auto m-auto"/>

      <p className="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style={coordToPositionClass(now.left)}>L</p>
      <p className="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style={coordToPositionClass(now.right)}>R</p>
      <p className="absolute text-[#0f0] text-center text-[32px] -translate-1/2" style={coordToPositionClass(now.nose())}>nose</p>
    </div>
  );
}

function coordToPositionClass(point: number[]): CSSProperties {
  return ({
    left: toScreen(point[0]),
    top: toScreen(point[1])
  })
}

function toScreen(p: number): string {
  return `${p * 100}%`
}
