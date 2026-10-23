import { Landmark } from "handsfree"

export class Landmarks implements Landmarks {
    public left: ProjectedPoint
    public right: ProjectedPoint

    public static fromMesh(mesh: Landmark[][]): Landmarks {
        const faceLandmarks = mesh[0]
        const left = faceLandmarks[362]
        const right = faceLandmarks[33]

        // `1 -` because the webcam is mirrored
        return new Landmarks([1 - left.x, left.y], [1 - right.x, right.y])
    }

    public constructor(left: ProjectedPoint, right: ProjectedPoint) {
        this.left = left
        this.right = right
    }

    public nose(): ProjectedPoint {
        return [
            (this.right[0] + this.left[0]) / 2, // midpoint on x
            (this.right[1] + this.left[1]) / 2  // midpoint on y
        ]
    }

    public distanceBetweenEyes(): number {
        const underRoot
            = Math.pow(this.right[0] - this.left[0], 2)
            + Math.pow(this.right[1] - this.left[1], 2)
        
        return Math.sqrt(underRoot)
    }
}

const DIFF_PARAM_SPACE = 4
const DIFF_THRESHOLD = 0.0001 * DIFF_PARAM_SPACE

export function smoothAndStabilize(prev: Landmarks, now: Landmarks): Landmarks {
    const diff = overallDiff(prev, now)

    // stybilizing by k – https://www.desmos.com/calculator/t0kxryqw8k
    // const linearK = diff - DIFF_THRESHOLD
    // const k = 1 - ( 1 / ( 1 + Math.exp(6 - 8.5 * linearK) ) )
    // console.log(linearK, k)

    const midLeft: ProjectedPoint = [(prev.left[0] + now.left[0]) / 2, (prev.left[1] + now.left[1]) / 2]
    const midRight: ProjectedPoint = [(prev.right[0] + now.right[0]) / 2, (prev.right[1] + now.right[1]) / 2]
    const smoothed = new Landmarks(midLeft, midRight)
    
    // return plus(times(prev, k), times(smoothed, (1 - k)))
    return smoothed
}

function overallDiff(a: Landmarks, b: Landmarks): number {
    function overallDiff(a: ProjectedPoint, b: ProjectedPoint): number {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
    }

    return overallDiff(a.left, b.left) + overallDiff(a.right, b.right)
}

type ProjectedPoint = number[] // of 2 numbers

// arithmetic helpers

function plus(a: Landmarks, b: Landmarks): Landmarks {
    return new Landmarks(
        [a.left[0] + b.left[0], a.left[1] + b.left[1]],
        [a.right[0] + b.right[0], a.right[1] + b.right[1]]
    )
}

function times(a: Landmarks, k: number): Landmarks {
    return new Landmarks(
        [a.left[0] * k, a.left[1] * k],
        [a.right[0] * k, a.right[1] * k]
    )
}