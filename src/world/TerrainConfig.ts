export const TerrainConfig = {
  CHUNK_SIZE: 32, // Units per chunk side
  CHUNK_SEGMENTS: 31, // Vertices per side (CHUNK_SIZE - 1 for proper subdivision)
  TERRAIN_SCALE: 50, // Noise scale (larger = smoother)
  TERRAIN_HEIGHT: 0, // Max height amplitude
  DRAW_DISTANCE: 3, // Chunks in each direction
  UPDATE_INTERVAL: 200, // Milliseconds between chunk updates
  MATERIAL_COLOR: 0x516b40, // Earthy green
} as const
