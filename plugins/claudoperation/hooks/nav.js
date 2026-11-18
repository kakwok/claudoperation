// Surface module for the approve pane: catches up/down while it has the focus
// (click the hint line once) and posts them to register.js, which moves the
// focus ring between claims. It never touches labels.
export default function Nav(props, s) {
  const { Text } = s.elements
  if (s.state === undefined) {
    s.setState(true)
    s.onKey((e) => {
      if (e.key === 'up' || e.key === 'down') s.post({ step: e.key === 'down' ? 1 : -1 })
    })
  }
  return Text({ dimColor: true, children: ['↑/↓ (click here first) or j/k: step between claims'] })
}
