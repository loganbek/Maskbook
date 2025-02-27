/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef, useLayoutEffect, useContext } from 'react'
import { createPortal } from 'react-dom'
import { DisableShadowRootContext } from './Contexts.js'
import { ShadowRootStyleProvider } from './ShadowRootStyleProvider.js'

/**
 * Render it's children inside a ShadowRoot to provide style isolation.
 */
export function ShadowRootIsolation({
    children,
    ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>) {
    const disabled = useRef(useContext(DisableShadowRootContext)).current

    if (disabled) return <span {...props}>{children}</span>

    const [dom, setDOM] = useState<HTMLSpanElement | null>()

    const container = useRef<HTMLDivElement>()
    if (!container.current) {
        container.current = document.createElement('div')
    }
    useLayoutEffect(() => {
        if (!dom) return
        if (dom.shadowRoot) return

        // Note: do not use process.env.shadowRootMode here because ShadowRootIsolation is expected to use inside other closed ShadowRoot
        const shadow = dom.attachShadow({ mode: 'open' })
        shadow.appendChild(container.current!)
    }, [dom])

    if (!dom?.shadowRoot) return <span {...props} ref={(x) => (x !== dom ? setDOM(x) : undefined)} />

    return (
        <span {...props}>
            <ShadowRootStyleProvider preventPropagation={false} shadow={dom.shadowRoot}>
                {createPortal(children, container.current)}
            </ShadowRootStyleProvider>
        </span>
    )
}
