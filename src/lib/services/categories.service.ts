import { getCategoriesRepository } from '@/lib/repositories/categories.repository';
import type { Category } from '@/lib/repositories/categories.repository';
import { getProductsRepository } from '@/lib/repositories/products.repository';

export interface CreateCategoryData {
  name: string;
  color?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategorySearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

class CategoriesService {
  private get repository() {
    return getCategoriesRepository();
  }

  private get productsRepository() {
    return getProductsRepository();
  }

  async getAllCategories(options?: CategorySearchOptions): Promise<Category[]> {
    return this.repository.findAll(options);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.repository.findById(id);
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    return this.repository.findByName(name);
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    // Check if category with same name already exists
    const existingCategory = await this.repository.findByName(data.name);
    if (existingCategory) {
      throw new Error(`Categoria "${data.name}" já existe`);
    }

    return this.repository.create({
      name: data.name.trim(),
      color: data.color || '#6366f1'
    });
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const existingCategory = await this.repository.findById(id);
    if (!existingCategory) {
      throw new Error('Categoria não encontrada');
    }

    // Check if new name conflicts with existing category
    if (data.name && data.name !== existingCategory.name) {
      const duplicateCategory = await this.repository.findByName(data.name);
      if (duplicateCategory) {
        throw new Error(`Categoria "${data.name}" já existe`);
      }
    }

    return this.repository.update(id, {
      name: data.name?.trim() || existingCategory.name,
      color: data.color || existingCategory.color
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Check if category is being used by any products
    const productsUsingCategory = await this.productsRepository.findByCategory(id);
    if (productsUsingCategory.length > 0) {
      throw new Error(
        `Não é possível excluir a categoria "${category.name}" pois está sendo usada por ${productsUsingCategory.length} produto(s)`
      );
    }

    await this.repository.delete(id);
  }

  async searchCategories(query: string): Promise<Category[]> {
    return this.repository.search({ query });
  }

  async validateCategoryExists(categoryId: string): Promise<boolean> {
    const category = await this.repository.findById(categoryId);
    return category !== null;
  }

  async getCategoriesWithProductCount(): Promise<Array<Category & { productCount: number }>> {
    const categories = await this.repository.findAll();
    
    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: Category) => {
        const products = await this.productsRepository.findByCategory(category.id);
        return {
          ...category,
          productCount: products.length
        };
      })
    );

    return categoriesWithCount;
  }
}

export const categoriesService = new CategoriesService();