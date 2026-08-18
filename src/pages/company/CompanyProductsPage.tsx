import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Product, ProductCategory, Company } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const CompanyProductsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'ETB',
    categoryId: '',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    featured: false,
  });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, c, comp] = await Promise.all([
        api.getProducts(id),
        api.getProductCategories(id),
        api.getCompany(id),
      ]);
      setProducts(p || []);
      setCategories(c || []);
      const loadedComp: any = (comp as any)?.company || comp;
      if (loadedComp) setCompany(loadedComp);
      if (c && c.length > 0 && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: c[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      description: '',
      price: 100,
      currency: 'ETB',
      categoryId: categories[0]?.id || '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      featured: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      currency: p.currency || 'ETB',
      categoryId: p.categoryId,
      image: p.image || '',
      featured: !!p.featured,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.name) return;
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, form);
      } else {
        await api.createProduct({ ...form, companyId: id });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/company/${id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Products & Menu Catalog
            </h1>
            <p className="text-xs text-slate-500">
              Manage items, prices in Ethiopian Birr (ETB), category groupings, and featured flags.
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add New Item
        </Button>
      </div>

      <Table<Product>
        isLoading={loading}
        data={products}
        keyExtractor={(p: Product) => p.id}
        columns={[
          {
            key: 'name',
            header: 'Item & Details',
            render: (p: Product) => (
              <div className="flex items-center gap-3">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</span>
                    {p.featured && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{p.description}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Price (ETB)',
            render: (p: Product) => (
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {p.price.toLocaleString()} {p.currency}
              </span>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            render: (p: Product) => {
              const cat = categories.find((c: ProductCategory) => c.id === p.categoryId);
              return <Badge variant="neutral" size="sm">{cat?.name || 'Standard'}</Badge>;
            },
          },
          {
            key: 'status',
            header: 'Visibility',
            render: (p: Product) => (
              <Badge variant={p.status === 'active' ? 'active' : 'draft'} size="sm">
                {p.status === 'active' ? 'Available' : p.status || 'Draft'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (p: Product) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(p)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Item' : 'Add New Product / Menu Item'}
        description="Fill out the item details for your live digital storefront."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Item Title *"
            required
            placeholder="e.g. Traditional Special Tibs"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (ETB) *"
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Menu Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Image URL"
            placeholder="https://..."
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Item Description
            </label>
            <textarea
              rows={3}
              placeholder="Freshly prepared beef cooked with rosemary, garlic, and Ethiopian spiced butter..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-slate-900"
            />
            <label htmlFor="featured" className="text-xs font-bold text-slate-800">
              Highlight as Popular / Featured Item
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            {editingProduct ? 'Save Changes' : 'Create Item'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
