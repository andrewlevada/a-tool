"use client"

import Image from "next/image";
import { CSSProperties, useEffect, useRef, useState } from "react";
import Handsfree from 'handsfree'
import testImage from "../public/landscape.jpeg"
import { Landmarks } from "./landmarks";
import { useLandmarksQueue } from "./queue";

const factorForScale = 1
const factorForWidth = 1

export default function Home() {
  const [first, _, now, push] = useLandmarksQueue()
  const [imageData, setImageData] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

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
      
      <Image src={imageData || testImage} alt="tets image" className="w-[512px] h-auto m-auto hover:opacity-85 cursor-pointer" width={512} height={512} onClick={() => {
        inputRef.current?.click()
      }}/>

      <input ref={inputRef} className="hidden" type="file" accept="image/jpeg, image/png, image/webp, image/gif" onChange={(e) => {
        const file = (e.target.files || [null])[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.addEventListener("load", () => {
          if (typeof reader.result !== "string") return
          setImageData(reader.result)
        })
        reader.readAsDataURL(file)
      }}></input>

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
