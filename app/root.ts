import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AutoLitElement } from '@/lib/auto-lit-element'
import "./page"
import { provide } from '@lit/context'
import { GlobalContext, globalContextInstance } from './queue'

@customElement('root-element')
export class RootElement extends AutoLitElement {
    @provide({ context: globalContextInstance })
    globalContext = new GlobalContext()

    render() {
        return html`
            <test-page></test-page>
        `
    }
}
