import { Landmarks, smoothAndStabilize } from "./landmarks";
import { createContext } from '@lit/context';

export const globalContextInstance = createContext<GlobalContext>('global');

class LandmarksQueue {

    // It would be ideal for these properties to be readonly in public,
    // but settable in private, but i am not sure yet, how to do this
    // without a setter + private property pair

    public first?: Readonly<Landmarks>
    public prev?: Landmarks
    public now?: Landmarks

    public update(landmarks: Landmarks): void {
        const now = this.prev ? smoothAndStabilize(this.prev, landmarks) : landmarks

        this.first = this.first ?? landmarks
        this.prev = this.now
        this.now = now
    }
}

export class GlobalContext extends LandmarksQueue { }
