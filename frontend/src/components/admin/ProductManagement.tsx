import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { Product } from '@/types/pos';

// API Configuration
const apiConfig = {
  baseURL: "http://localhost:3001/api",
};

// API Service
export const apiServices = {
  async getProducts() {
    const response = await fetch(`${apiConfig.baseURL}/products`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  },

  async createProduct(productData: any, image?: File) {
    let response;
    if (image) {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "tags" && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append("image", image);

      response = await fetch(`${apiConfig.baseURL}/products`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: formData,
      });
    } else {
      response = await fetch(`${apiConfig.baseURL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create product");
    }
    return response.json();
  },

  async updateProduct(id: string, productData: any, image?: File | null) {
    // Create a clean data object with proper formatting
    const cleanData = {
      name: productData.name,
      price: productData.price,
      category: productData.category,
      description: productData.description || '',
      stock: productData.stock,
      tags: Array.isArray(productData.tags) ? productData.tags : []
    };

    const formData = new FormData();
    
    // Always append all product data with consistent formatting
    Object.entries(cleanData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "tags") {
          // Always send tags as JSON string
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Handle image cases
    if (image instanceof File) {
      formData.append("image", image);
    } else if (image === null) {
      formData.append("removeImage", "true");
    }

    const response = await fetch(`${apiConfig.baseURL}/products/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update product");
    }
    return response.json();
  },

  async deleteProduct(id: string) {
    const response = await fetch(`${apiConfig.baseURL}/products/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    if (response.status === 204) return;
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete product");
    }
    return response.json();
  },
};

function createAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ProductFormData {
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  tags: string[];
  image?: string;
}

export const ProductManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    category: '',
    description: '',
    stock: 0,
    tags: [],
    image: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const productListRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { setProducts, products: storeProducts } = useAppStore();

  // Fetch products from backend
  const { 
    data: products = [], 
    isLoading, 
    isError,
    refetch: refetchProducts
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiServices.getProducts(),
    enabled: true,
  });

  // Update store when products change
  useEffect(() => {
    if (products && products.length > 0) {
      setProducts(products);
    }
  }, [products, setProducts]);

  // Save scroll position before opening dialogs
  const saveScrollPosition = () => {
    setScrollPosition(window.scrollY);
  };

  // Restore scroll position after closing dialogs
  const restoreScrollPosition = () => {
    window.scrollTo(0, scrollPosition);
  };

  // Validate numeric input to ensure positive integers
  const validateNumericInput = (value: string, field: string): number => {
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue < 0) {
      toast.error(`${field} must be a positive number`);
      return 0;
    }
    
    return numValue;
  };

  // Validate price input to ensure positive number with 2 decimal places
  const validatePriceInput = (value: string): number => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Price must be a positive number');
      return 0;
    }
    
    // Round to 2 decimal places
    return Math.round(numValue * 100) / 100;
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: { productData: ProductFormData, image?: File }) => {
      return apiServices.createProduct(data.productData, data.image);
    },
    onSuccess: (newProduct) => {
      // Update both React Query cache and Zustand store
      queryClient.setQueryData(['products'], (old: Product[] = []) => [...old, newProduct]);
      setProducts([...storeProducts, newProduct]);
      
      toast.success('Product created successfully');
      resetForm();
      setIsCreateDialogOpen(false);
      restoreScrollPosition();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
      restoreScrollPosition();
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: { id: string, productData: Partial<ProductFormData>, image?: File | null }) => {
      return apiServices.updateProduct(data.id, data.productData, data.image);
    },
    onSuccess: (updatedProduct) => {
      // Update both React Query cache and Zustand store
      queryClient.setQueryData(['products'], (old: Product[] = []) => 
        old.map(product => product.id === updatedProduct.id ? updatedProduct : product)
      );
      setProducts(storeProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      ));
      
      toast.success('Product updated successfully');
      resetForm();
      setIsEditDialogOpen(false);
      restoreScrollPosition();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
      restoreScrollPosition();
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiServices.deleteProduct(productId),
    onSuccess: (_, productId) => {
      // Update both React Query cache and Zustand store
      queryClient.setQueryData(['products'], (old: Product[] = []) => 
        old.filter(product => product.id !== productId)
      );
      setProducts(storeProducts.filter(product => product.id !== productId));
      
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || formData.price <= 0 || formData.stock < 0) {
      toast.error('Please fill in all required fields with valid values');
      return;
    }

    // Enforce image requirement for new products
    if (!editingProduct && !productImageFile) {
      toast.error('Product image is required');
      return;
    }

    // Ensure tags is always an array
    const formattedData = {
      ...formData,
      tags: Array.isArray(formData.tags) ? formData.tags : []
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        productData: formattedData,
        image: isImageChanged ? productImageFile || null : undefined
      });
    } else {
      createProductMutation.mutate({
        productData: formattedData,
        image: productImageFile || undefined
      });
    }
  };

  const handleEdit = (product: Product) => {
    saveScrollPosition();
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || '',
      stock: product.stock,
      tags: product.tags || [],
      image: product.image || ''
    });
    setCurrentImageUrl(product.image ? getImageUrl(product.image) : null);
    setProductImageFile(null);
    setIsImageChanged(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteProductMutation.mutate(deletingProduct.id);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      setIsImageChanged(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, image: event.target?.result as string});
      };
      reader.readAsDataURL(file);
    } else {
      setProductImageFile(null);
      setIsImageChanged(false);
      if (!editingProduct) {
        setFormData({...formData, image: ''});
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: '',
      description: '',
      stock: 0,
      tags: [],
      image: ''
    });
    setEditingProduct(null);
    setCurrentImageUrl(null);
    setTagInput('');
    setProductImageFile(null);
    setIsImageChanged(false);
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    return `${apiConfig.baseURL}${imagePath}`;
  };

  // Handle dialog close events
  const handleDialogClose = () => {
    if (isCreateDialogOpen) {
      setIsCreateDialogOpen(false);
    }
    if (isEditDialogOpen) {
      setIsEditDialogOpen(false);
    }
    restoreScrollPosition();
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load products. Please try again.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetchProducts()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" onClick={() => {
                  saveScrollPosition();
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({
                          ...formData, 
                          price: validatePriceInput(e.target.value)
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({
                          ...formData, 
                          stock: validateNumericInput(e.target.value, "Stock")
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma separated, then press Enter)</Label>
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="tag1, tag2, tag3"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image" className="flex items-center">
                      Product Image *
                      {!productImageFile && (
                        <Badge variant="destructive" className="ml-2">
                          Required
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required={!editingProduct}
                    />
                    {!productImageFile && (
                      <div className="mt-2 flex items-center text-sm text-amber-600">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Please select an image for this product
                      </div>
                    )}
                    {formData.image && (
                      <div className="mt-2">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="max-h-40 rounded-md border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      type="submit"
                      disabled={createProductMutation.isPending || (!editingProduct && !productImageFile)}
                    >
                      {createProductMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Create Product
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDialogClose}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        <div ref={productListRef}>
          <h2 className="text-xl font-semibold mb-4">Product List</h2>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500 mb-4">Add your first product using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const imageUrl = getImageUrl(product.image);
                return (
                  <Card key={product.id} className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-md mb-4"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                        {product.description || 'No description available'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.tags?.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Ksh {product.price.toFixed(2)}</span>
                        <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="name">Product Name *</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="category">Category *</Label>
                              <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.price}
                                  onChange={(e) => setFormData({
                                    ...formData, 
                                    price: validatePriceInput(e.target.value)
                                  })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="stock">Stock Quantity *</Label>
                                <Input
                                  id="stock"
                                  type="number"
                                  min="0"
                                  value={formData.stock}
                                  onChange={(e) => setFormData({
                                    ...formData, 
                                    stock: validateNumericInput(e.target.value, "Stock")
                                  })}
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="tags">Tags (comma separated)</Label>
                              <Input
                                id="tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag();
                                  }
                                }}
                                placeholder="tag1, tag2, tag3"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.tags.map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="secondary" 
                                    className="cursor-pointer hover:bg-gray-200"
                                    onClick={() => removeTag(tag)}
                                  >
                                    {tag} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="image">Product Image</Label>
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                              <div className="space-y-2 mt-2">
                                {currentImageUrl && !isImageChanged && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Current image:</p>
                                    <img 
                                      src={currentImageUrl} 
                                      alt="Current" 
                                      className="max-h-40 rounded-md border"
                                    />
                                  </div>
                                )}
                                {isImageChanged && formData.image && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">New image preview:</p>
                                    <img 
                                      src={formData.image} 
                                      alt="New preview" 
                                      className="max-h-40 rounded-md border"
                                    />
                                  </div>
                                )}
                                {isImageChanged && !formData.image && (
                                  <p className="text-sm text-gray-500">No image selected</p>
                                )}
                              </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                              <Button
                                type="submit"
                                disabled={updateProductMutation.isPending}
                              >
                                {updateProductMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Update Product
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleDialogClose}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{deletingProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingProduct?.image && (
              <div className="flex justify-center mb-4">
                <img 
                  src={getImageUrl(deletingProduct.image)} 
                  alt={deletingProduct.name}
                  className="h-32 object-cover rounded-md"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span> {deletingProduct?.category}
              </div>
              <div>
                <span className="font-medium">Price:</span> Ksh {deletingProduct?.price.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Stock:</span> {deletingProduct?.stock}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};