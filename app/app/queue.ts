import { useRef, useState } from "react";
import { Landmarks, smoothAndStabilize } from "./landmarks";

export type UseLandmarksQueueReturnType = [
    Landmarks | undefined, Landmarks | undefined, Landmarks | undefined, (_: Landmarks) => void
]

export function useLandmarksQueue(): UseLandmarksQueueReturnType {
    const [queue, setQueue] = useState<LandmarksQueue>()
    const ref = useRef(queue) // i really don't like react

    const push = (landmarks: Landmarks): void => {
        const queue = ref.current

        const now = queue?.prev ? smoothAndStabilize(queue.prev, landmarks) : landmarks
        const value: LandmarksQueue = {
            first: queue?.first ?? landmarks,
            prev: queue?.now,
            now: now
        }

        ref.current = value
        setQueue(value)
    }

    return [queue?.first, queue?.prev, queue?.now, push]
}

interface LandmarksQueue {
    first?: Landmarks
    prev?: Landmarks
    now?: Landmarks
}
