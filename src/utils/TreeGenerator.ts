import { Tree } from '@dgreenheck/ez-tree'

export const TreeSize = {
  Small: 'Ash Small',
  Medium: 'Ash Medium',
  Large: 'Ash Large',
} as const

export type TreeSize = (typeof TreeSize)[keyof typeof TreeSize]

export class TreeGenerator {
  /**
   * Generate a tree using Ash preset (small, medium, or large)
   * Returns the generated tree
   */
  public static createTree(size: TreeSize, seed?: number): Tree {
    const tree = new Tree()

    // Load the preset
    tree.loadPreset(size)

    // Optionally set a custom seed for variation
    if (seed !== undefined) {
      tree.options.seed = seed
    }

    // Generate the tree geometry
    tree.generate()

    return tree
  }

  /**
   * Create all three Ash tree variations
   * Returns an array of [small, medium, large] trees
   */
  public static createAllVariations(): Tree[] {
    return [
      TreeGenerator.createTree(TreeSize.Small),
      TreeGenerator.createTree(TreeSize.Medium),
      TreeGenerator.createTree(TreeSize.Large),
    ]
  }

  /**
   * Create a tree with reduced triangle count for LOD
   * @param size - Tree size preset
   * @param lodLevel - 0 (high detail), 1 (medium), 2 (low)
   * @param seed - Optional seed for variation
   */
  public static createTreeLOD(
    size: TreeSize,
    lodLevel: number,
    seed?: number,
  ): Tree {
    const tree = new Tree()
    tree.loadPreset(size)

    if (seed !== undefined) {
      tree.options.seed = seed
    }

    // Reduce geometry detail based on LOD level
    // Note: segments and sections are objects with keys 0-3 for each branch level
    const segments = tree.options.branch.segments as any
    const sections = tree.options.branch.sections as any

    switch (lodLevel) {
      case 0: // High detail (original)
        // No changes needed
        break
      case 1: // Medium detail (~50% triangles)
        // Reduce segments and sections for each branch level
        for (let i = 0; i <= 3; i++) {
          if (segments[i] !== undefined) {
            segments[i] = Math.max(3, Math.floor(segments[i] * 0.6))
          }
          if (sections[i] !== undefined) {
            sections[i] = Math.max(2, Math.floor(sections[i] * 0.6))
          }
        }
        // Reduce leaf count
        tree.options.leaves.count = Math.floor(tree.options.leaves.count * 0.6)
        break
      case 2: // Low detail (~25% triangles)
        // Minimum segments and sections for each branch level
        for (let i = 0; i <= 3; i++) {
          if (segments[i] !== undefined) {
            segments[i] = 3 // Minimum for cylinder
          }
          if (sections[i] !== undefined) {
            sections[i] = Math.max(1, Math.floor(sections[i] * 0.4))
          }
        }
        // Minimal leaf count
        tree.options.leaves.count = Math.floor(tree.options.leaves.count * 0.3)
        break
    }

    tree.generate()
    return tree
  }

  /**
   * Create all variations with all LOD levels
   * Returns array of [size][lodLevel]
   */
  public static createAllVariationsWithLOD(): Tree[][] {
    const sizes = [TreeSize.Small, TreeSize.Medium, TreeSize.Large]
    const lodLevels = 3 // 0, 1, 2

    return sizes.map((size) => {
      return Array.from({ length: lodLevels }, (_, lodLevel) =>
        TreeGenerator.createTreeLOD(size, lodLevel),
      )
    })
  }
}
