//  VeridianTheme.swift
//  Veridian Markets — design tokens for the iOS app, ported from the web kit's
//  design system (ui_kits/web/primitives.jsx → the `VM` object).
//
//  Usage:
//      Text("Apple Inc.").font(VM.serif(28, .bold)).foregroundColor(VM.ink)
//      Text("AAPL").font(VM.mono(13, .semibold)).foregroundColor(VM.tealInk)
//      RoundedRectangle(cornerRadius: 14).fill(VM.paper)
//
//  Fonts: add Spectral + JetBrains Mono (Google Fonts) to the Xcode target and
//  list them under UIAppFonts in Info, or the .custom(...) calls fall back to the
//  system font. Swap the names below to the exact PostScript names if needed.

import SwiftUI

enum VM {

    // MARK: Ink (warm near-black → faint)
    static let ink      = Color(hex: "1F1D1A")
    static let ink2     = Color(hex: "4A4640")
    static let ink3     = Color(hex: "8A857D")
    static let faint    = Color(hex: "B6AFA2")

    // MARK: Paper (warm creams) + the cool rail
    static let paper     = Color(hex: "FBF9F3")
    static let paperWarm = Color(hex: "F4F1E8")
    static let paperDeep = Color(hex: "ECE7DB")
    static let rail      = Color(hex: "E7ECED")

    // MARK: Green (the brand workhorse)
    static let teal      = Color(hex: "2D5E5A")   // links / active
    static let forest    = Color(hex: "1D4E3A")   // "the principle" / hero fills
    static let tealInk   = Color(hex: "0F6E56")   // positive numerals
    static let tealTint  = Color(hex: "E1F1EC")
    static let tealTint2 = Color(hex: "CFE5DD")

    // MARK: Terracotta accent
    static let terra    = Color(hex: "C46A3B")
    static let rust     = Color(hex: "B35A3A")
    static let rustDeep = Color(hex: "A8512A")

    // MARK: Market semantics (never bright red/green)
    static let up     = Color(hex: "1D9E75")   // up line
    static let upInk  = Color(hex: "0F6E56")   // up text
    static let down   = Color(hex: "C0563B")   // down line
    static let downInk = Color(hex: "A32D2D")  // down text

    // MARK: Hairlines (ink at low opacity)
    static let border     = Color(hex: "1F1D1A").opacity(0.18)
    static let borderSoft = Color(hex: "1F1D1A").opacity(0.10)
    static let borderHair = Color(hex: "1F1D1A").opacity(0.06)

    // MARK: Type — serif = story, mono = data
    static func serif(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .custom("Spectral", size: size).weight(weight)
    }
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .custom("JetBrains Mono", size: size).weight(weight)
    }
}

// Hex → Color helper (supports "RGB", "RRGGBB", "AARRGGBB").
extension Color {
    init(hex: String) {
        let s = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        let a, r, g, b: UInt64
        switch s.count {
        case 3:  (a, r, g, b) = (255, (v >> 8) * 17, (v >> 4 & 0xF) * 17, (v & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, v >> 16, v >> 8 & 0xFF, v & 0xFF)
        case 8:  (a, r, g, b) = (v >> 24, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}
