import { html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { AutoLitElement } from "./lib/auto-lit-element";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import Handsfree from 'handsfree'
import { Landmarks } from "./landmarks";
import { consume } from "@lit/context";
import { GlobalContext, globalContextInstance } from "./queue";
import testImage from "./landscape.jpeg"
import { styleMap } from "lit/directives/style-map.js";

@customElement("test-page")
export class TestPage extends AutoLitElement {
	@consume({ context: globalContextInstance })
	landmarks!: GlobalContext
	
	@state() private imageData: string | undefined

	private inputRef: Ref<HTMLInputElement> = createRef()

	connectedCallback(): void {
		super.connectedCallback()

		const handsfree = new Handsfree({
			facemesh: true
		})

		handsfree.start()

		document.addEventListener('handsfree-data', (_ => {
			const landmarks = handsfree.data.facemesh?.multiFaceLandmarks
			if (!landmarks) return

			this.landmarks.update(
				Landmarks.fromMesh(landmarks)
			)
			this.requestUpdate()
		}))
	}
	
	render() {
		if (!this.landmarks.first || !this.landmarks.now) {
			return html`
				<div>loading...</div>
				<button class="bg-amber-200" @click=${() => {
					navigator.permissions.query({ name: "camera" })
				}}>give camera access</button>
			`
		}

		return html`
			<div class="w-dvw h-dvh" style=${this.rootTransformStyle()}>
				<img .src=${this.imageData || testImage} alt="tets image" class="w-512 h-auto m-auto hover:opacity-85 cursor-pointer" width=512 height=512 @click=${() => {
					this.inputRef.value?.click()
				}}/>

				<input ${ref(this.inputRef)} class="hidden" type="file" accept="image/jpeg, image/png, image/webp, image/gif" @change=${() => {
					const file = (this.inputRef.value?.files || [null])[0]
					if (!file) return
					
					const reader = new FileReader()
					reader.addEventListener("load", () => {
						if (typeof reader.result !== "string") return
						this.imageData = reader.result
					})

					reader.readAsDataURL(file)
				}}></input>

				<p class="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style=${coordToPositionClass(this.landmarks.now.left)}>L</p>
				<p class="absolute text-[#f0f] text-center text-[32px] -translate-1/2" style=${coordToPositionClass(this.landmarks.now.right)}>R</p>
				<p class="absolute text-[#0f0] text-center text-[32px] -translate-1/2" style=${coordToPositionClass(this.landmarks.now.nose())}>nose</p>
    		</div>
		`
	}

	private rootTransformStyle(): ReturnType<typeof styleMap> {
		if (!this.landmarks.first || !this.landmarks.now) return {}

		const factorForScale = 1
		const factorForWidth = 1

		return styleMap({
			transform: `
        		scale(${1 - factorForScale + (this.landmarks.now.distanceBetweenEyes() / this.landmarks.first.distanceBetweenEyes()) * factorForScale})
        		translateX(${(this.landmarks.now.nose()[0] - this.landmarks.first.nose()[0]) * 100 * factorForWidth}%)
        		translateY(${(this.landmarks.now.nose()[1] - this.landmarks.first.nose()[1]) * 100 * factorForWidth}%)
      		`
		})
	}
}

function coordToPositionClass(point: number[]): ReturnType<typeof styleMap> {
  return styleMap({
    left: toScreen(point[0]),
    top: toScreen(point[1])
  })
}

function toScreen(p: number): string {
  return `${p * 100}%`
}
