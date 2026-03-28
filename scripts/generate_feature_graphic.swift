import AppKit
import Foundation

let fileManager = FileManager.default
let cwd = fileManager.currentDirectoryPath
let logoPath = "\(cwd)/assets/images/main_logo.png"
let outputPath = "\(cwd)/assets/images/feature-graphic-playstore-1024x500.png"

let canvasSize = NSSize(width: 1024, height: 500)
let rect = NSRect(origin: .zero, size: canvasSize)

guard let logo = NSImage(contentsOfFile: logoPath) else {
  fputs("Unable to load logo at \(logoPath)\n", stderr)
  exit(1)
}

func color(_ hex: UInt32, alpha: CGFloat = 1.0) -> NSColor {
  NSColor(
    calibratedRed: CGFloat((hex >> 16) & 0xFF) / 255.0,
    green: CGFloat((hex >> 8) & 0xFF) / 255.0,
    blue: CGFloat(hex & 0xFF) / 255.0,
    alpha: alpha
  )
}

let bitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: Int(canvasSize.width),
  pixelsHigh: Int(canvasSize.height),
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

let gradient = NSGradient(colors: [
  color(0x06131F),
  color(0x0A2943),
  color(0x160B2F)
])!
gradient.draw(in: rect, angle: 20)

func fillCircle(center: CGPoint, radius: CGFloat, color: NSColor) {
  let circleRect = NSRect(
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2
  )
  let path = NSBezierPath(ovalIn: circleRect)
  color.setFill()
  path.fill()
}

fillCircle(center: CGPoint(x: 190, y: 360), radius: 210, color: color(0x5BE7F1, alpha: 0.18))
fillCircle(center: CGPoint(x: 860, y: 120), radius: 240, color: color(0xB76CFF, alpha: 0.16))

let panelRect = NSRect(x: 548, y: 54, width: 410, height: 392)
let panelPath = NSBezierPath(roundedRect: panelRect, xRadius: 30, yRadius: 30)
color(0xFFFFFF, alpha: 0.08).setFill()
panelPath.fill()
color(0xFFFFFF, alpha: 0.16).setStroke()
panelPath.lineWidth = 1
panelPath.stroke()

logo.draw(
  in: NSRect(x: 84, y: 108, width: 270, height: 270),
  from: .zero,
  operation: .sourceOver,
  fraction: 1.0
)

func drawText(
  _ text: String,
  at point: CGPoint,
  size: CGFloat,
  weight: NSFont.Weight,
  color: NSColor,
  kern: Double = 0,
  paragraphStyle: NSParagraphStyle? = nil
) {
  let font = NSFont.systemFont(ofSize: size, weight: weight)
  let style = (paragraphStyle?.mutableCopy() as? NSMutableParagraphStyle) ?? NSMutableParagraphStyle()
  let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .kern: kern,
    .paragraphStyle: style
  ]
  let attributed = NSAttributedString(string: text, attributes: attributes)
  attributed.draw(at: point)
}

drawText("GENTLEWAIT", at: CGPoint(x: 408, y: 328), size: 28, weight: .semibold, color: .white, kern: 2.4)
drawText("Pause before", at: CGPoint(x: 408, y: 256), size: 56, weight: .bold, color: .white)
drawText("distracting apps", at: CGPoint(x: 408, y: 192), size: 56, weight: .bold, color: .white)
drawText("Breathe. Reflect. Build calmer screen habits.", at: CGPoint(x: 408, y: 136), size: 24, weight: .medium, color: color(0xD6E7F7))

func drawBadge(y: CGFloat, width: CGFloat, fill: NSColor, stroke: NSColor, dot: NSColor, text: String) {
  let badgeRect = NSRect(x: 584, y: y, width: width, height: 64)
  let badgePath = NSBezierPath(roundedRect: badgeRect, xRadius: 22, yRadius: 22)
  fill.setFill()
  badgePath.fill()
  stroke.setStroke()
  badgePath.lineWidth = 1
  badgePath.stroke()

  let dotRect = NSRect(x: badgeRect.minX + 22, y: badgeRect.midY - 9, width: 18, height: 18)
  let dotPath = NSBezierPath(ovalIn: dotRect)
  dot.setFill()
  dotPath.fill()

  drawText(text, at: CGPoint(x: badgeRect.minX + 56, y: badgeRect.minY + 18), size: 22, weight: .semibold, color: .white)
}

drawBadge(
  y: 286,
  width: 304,
  fill: color(0x7DE7F4, alpha: 0.12),
  stroke: color(0x7DE7F4, alpha: 0.28),
  dot: color(0x7DE7F4),
  text: "Gentle pause screen"
)

drawBadge(
  y: 202,
  width: 318,
  fill: color(0xC48CFF, alpha: 0.12),
  stroke: color(0xC48CFF, alpha: 0.28),
  dot: color(0xC48CFF),
  text: "Breathing and grounding"
)

drawBadge(
  y: 118,
  width: 352,
  fill: color(0xFFFFFF, alpha: 0.08),
  stroke: color(0xFFFFFF, alpha: 0.18),
  dot: color(0x9EDBFF),
  text: "Insights, journaling, reflection"
)

NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Unable to generate PNG data\n", stderr)
  exit(1)
}

do {
  try pngData.write(to: URL(fileURLWithPath: outputPath))
  print(outputPath)
} catch {
  fputs("Unable to write output: \(error)\n", stderr)
  exit(1)
}
