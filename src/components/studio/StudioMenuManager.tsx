import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Trash2,
  Image,
  Tag,
  Flame,
  Leaf,
  Star,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  DollarSign,
  Info,
} from 'lucide-react';
import { Product, ProductCategory, Company } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { MenuItemDetailModal } from '../website/MenuItemDetailModal';

interface StudioMenuManagerProps {
  company: Company;
  products: Product[];
  productCategories: ProductCategory[];
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddCategory: (category: Partial<ProductCategory>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const StudioMenuManager: React.FC<StudioMenuManagerProps> = ({
  company,
  products = [],
  productCategories = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  // New/Edit Item Form State
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    price: 0,
    oldPrice: 0,
    currency: 'ETB',
    description: '',
    image: '',
    featured: false,
    spicyLevel: 0,
    isVegetarian: false,
    isVegan: false,
    isHalal: true,
    ingredientsText: '',
    allergensText: '',
    prepTime: '',
    calories: '',
    visibility: true,
  });

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Preview Modal Test State
  const [previewItem, setPreviewItem] = useState<Product | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      categoryId: productCategories[0]?.id || '',
      price: 150,
      oldPrice: 0,
      currency: 'ETB',
      description: '',
      image: '',
      featured: false,
      spicyLevel: 0,
      isVegetarian: false,
      isVegan: false,
      isHalal: true,
      ingredientsText: '',
      allergensText: '',
      prepTime: '15-20 min',
      calories: '',
      visibility: true,
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: Product) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      price: Number(item.price) || 0,
      oldPrice: (item as any).oldPrice || 0,
      currency: item.currency || 'ETB',
      description: item.description || '',
      image: item.image || '',
      featured: !!item.featured,
      spicyLevel: (item as any).spicyLevel || 0,
      isVegetarian: (item as any).isVegetarian || false,
      isVegan: (item as any).isVegan || false,
      isHalal: (item as any).isHalal !== undefined ? (item as any).isHalal : true,
      ingredientsText: Array.isArray((item as any).ingredients) ? (item as any).ingredients.join(', ') : '',
      allergensText: Array.isArray((item as any).allergens) ? (item as any).allergens.join(', ') : '',
      prepTime: (item as any).prepTime || '',
      calories: (item as any).calories || '',
      visibility: item.visibility !== false,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    const payload: Partial<Product> = {
      name: itemForm.name.trim(),
      categoryId: itemForm.categoryId || productCategories[0]?.id,
      price: Number(itemForm.price) || 0,
      currency: itemForm.currency || 'ETB',
      description: itemForm.description.trim(),
      image: itemForm.image.trim(),
      featured: itemForm.featured,
      visibility: itemForm.visibility,
      ...(itemForm.oldPrice > 0 ? { oldPrice: Number(itemForm.oldPrice) } : {}),
      ...(itemForm.spicyLevel > 0 ? { spicyLevel: Number(itemForm.spicyLevel) } : {}),
      ...(itemForm.isVegetarian ? { isVegetarian: true } : { isVegetarian: false }),
      ...(itemForm.isVegan ? { isVegan: true } : { isVegan: false }),
      ...(itemForm.isHalal ? { isHalal: true } : { isHalal: false }),
      ...(itemForm.ingredientsText ? { ingredients: itemForm.ingredientsText.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(itemForm.allergensText ? { allergens: itemForm.allergensText.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(itemForm.prepTime ? { prepTime: itemForm.prepTime.trim() } : {}),
      ...(itemForm.calories ? { calories: itemForm.calories.trim() } : {}),
    };

    if (editingItem) {
      await onUpdateProduct(editingItem.id, payload);
    } else {
      await onAddProduct(payload);
    }

    setIsItemModalOpen(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await onAddCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
    });
    setNewCatName('');
    setNewCatDesc('');
    setIsCatModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Menu & Catalog Builder
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {products.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500">Manage dishes, products, prices, and dietary tags</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCatModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Category</span>
          </button>

          <button
            type="button"
            onClick={openAddItemModal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search food items or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            All ({products.length})
          </button>
          {productCategories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-3">
            <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-300">No menu items found</p>
            <p className="text-[11px] text-slate-500">
              {searchQuery ? 'Try clearing your search keyword.' : 'Click "Add Item" to create your first meal or product.'}
            </p>
            <Button size="sm" variant="primary" icon={Plus} onClick={openAddItemModal}>
              Add First Item
            </Button>
          </div>
        ) : (
          filteredProducts.map((item) => {
            const categoryName = productCategories.find((c) => c.id === item.categoryId)?.name || 'General';

            return (
              <div
                key={item.id}
                className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Utensils className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      {item.featured && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                          ★ Featured
                        </span>
                      )}
                      {item.visibility === false && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-extrabold text-amber-400">
                        {item.price.toLocaleString()} {item.currency || 'ETB'}
                      </span>
                      <span>·</span>
                      <span className="truncate">{categoryName}</span>
                    </div>

                    {item.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewItem(item);
                      setPreviewModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-400 transition-colors"
                    title="Live Test Modal Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditItemModal(item)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(item.id)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-rose-400 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? `Edit: ${editingItem.name}` : 'Add Menu Item / Product'}
        description="Configure item details, dietary tags, preparation time, and high-resolution photo."
      >
        <form onSubmit={handleSaveItem} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
          <Input
            label="Dish / Item Name *"
            required
            placeholder="e.g. Special Tibs or Double Smash Burger"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Category *
              </label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {productCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Price *"
                type="number"
                required
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
              />
              <Input
                label="Currency"
                value={itemForm.currency}
                onChange={(e) => setItemForm({ ...itemForm, currency: e.target.value })}
              />
            </div>
          </div>

          <Input
            label="Image URL"
            placeholder="https://images.unsplash.com/photo-..."
            value={itemForm.image}
            onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
            helperText="Paste direct photo link or Unsplash food URL"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description / Taste Profile
            </label>
            <textarea
              rows={3}
              placeholder="Freshly grilled beef cubes sautéed with onions, rosemary, jalapeños, and spiced butter..."
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Dietary & Specialty Badges */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              Dietary & Specialty Tags
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.featured}
                  onChange={(e) => setItemForm({ ...itemForm, featured: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>★ Featured</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isVegetarian}
                  onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span>🥬 Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isVegan}
                  onChange={(e) => setItemForm({ ...itemForm, isVegan: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span>🌱 Vegan</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isHalal}
                  onChange={(e) => setItemForm({ ...itemForm, isHalal: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>☪️ 100% Halal</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ingredients (comma-separated)"
              placeholder="e.g. Beef, Onions, Rosemary, Garlic"
              value={itemForm.ingredientsText}
              onChange={(e) => setItemForm({ ...itemForm, ingredientsText: e.target.value })}
            />
            <Input
              label="Allergens (comma-separated)"
              placeholder="e.g. Dairy, Gluten, Nuts"
              value={itemForm.allergensText}
              onChange={(e) => setItemForm({ ...itemForm, allergensText: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Prep Time"
              placeholder="e.g. 15-20 min"
              value={itemForm.prepTime}
              onChange={(e) => setItemForm({ ...itemForm, prepTime: e.target.value })}
            />
            <Input
              label="Calories (optional)"
              placeholder="e.g. 450 kcal"
              value={itemForm.calories}
              onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Add Menu Category"
        description="Organize your dishes into distinct sections (e.g. Main Courses, Hot Drinks, Desserts)."
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name *"
            required
            placeholder="e.g. Breakfast Specialties"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />

          <Input
            label="Category Description"
            placeholder="e.g. Served fresh every morning from 7:00 AM"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCatModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Plus}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Test Preview Modal */}
      <MenuItemDetailModal
        item={previewItem}
        categoryName={productCategories.find((c) => c.id === previewItem?.categoryId)?.name}
        company={company}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewItem(null);
        }}
      />
    </div>
  );
};
