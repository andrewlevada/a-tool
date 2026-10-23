In this project i am experimenting with how flat web elements can appear to be
placed in a 3D space by adjusting their scale, position and rotation depending
on where the user is looking at the screen from!

#### How it works

1. video feed from the webcam is processed with
   [mediapipe](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)
   to get landmarks of the page visitor's face
2. we save the initial positions of the eyes, face's size and the face's center
3. and then we compare real-time values of these same parameters and transform
   the UI in direct proportion:
   - face size determines `scale`
   - face position determines `translation`

---

Started as part of Tools for Creativity course at [SFPC](https://sfpc.study)
