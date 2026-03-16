export const PUZZLES = {
  1: {
    id: 1,
    type: 'triangle',
    points: { X:[0,2], Y:[-2,0], Z:[2,0], A:[-1,1], B:[0,0], C:[1,1], D:[0,2/3], E:[0,1], F:[-0.5,0.5], G:[0.5,0.5] },
    lines: [["X","A","Y"],["X","C","Z"],["Y","B","Z"],["A","E","C"],["X","E","D","B"],["Y","F","D","C"],["A","D","G","Z"],["A","F","B"],["C","G","B"]],
    solutions: [
      "ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ",
      "ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ",
      "ABE","ABG","ACF","ACG","BCE","BCF",
      "ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ",
      "ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ",
      "XYZ"
    ],
    sizeGroups: {
      1:  { label: "1칸", enLabel: "Tiny", tris: ["ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ"] },
      2:  { label: "2칸", enLabel: "Small", tris: ["ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ"] },
      3:  { label: "3칸", enLabel: "Medium", tris: ["ABE","ABG","ACF","ACG","BCE","BCF"] },
      4:  { label: "4칸", enLabel: "Large", tris: ["ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ"] },
      6:  { label: "6칸", enLabel: "Huge", tris: ["ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ"] },
      12: { label: "전체", enLabel: "Max", tris: ["XYZ"] },
    }
  },
  2: {
    id: 2,
    type: 'quad',
    points: { A:[-1,1], B:[1,1], C:[1,-1], D:[-1,-1], E:[0,1], F:[1,0], G:[0,-1], H:[-1,0], I:[0,0] },
    lines: [["A","E","B"],["B","F","C"],["C","G","D"],["D","H","A"],["E","I","G"],["H","I","F"]],
    solutions: [
      "AEIH", "EBFI", "IFCG", "HIGD", // 1-unit squares
      "ABGH", "EBCD", "AEGD", "HBCF", // 2-unit rects
      "ABCD" // 4-unit square
    ],
    sizeGroups: {
      1: { label: "1칸", enLabel: "Tiny", tris: ["AEIH", "EBFI", "IFCG", "HIGD"] },
      2: { label: "2칸", enLabel: "Double", tris: ["ABGH", "EBCD", "AEGD", "HBCF"] },
      4: { label: "전체", enLabel: "Whole", tris: ["ABCD"] }
    }
  }
};
