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
}
