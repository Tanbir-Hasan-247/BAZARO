import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiImage,
  FiLink,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";
import apiClient from "../../Services/api-client";
import { useAccessibleDialog } from "../../hooks/useAccessibleDialog";
import { useDeferredValidation } from "../../hooks/useDeferredValidation";

function formatListToCsv(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

function parseCsvToList(str) {
  return String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const AdminProductModal = ({
  isOpen,
  onClose,
  categories = [],
  editingProduct = null,
  onSaved,
  onNotify,
}) => {
  const { dialogRef, contentRef } = useAccessibleDialog(isOpen, onClose);
  const { fieldErrors, getFieldProps, validateFormOnSubmit, resetValidation } =
    useDeferredValidation();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [sizesText, setSizesText] = useState("");

  const [existingImages, setExistingImages] = useState([]);
  const [queuedFiles, setQueuedFiles] = useState([]); // File[]
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [queuedUrls, setQueuedUrls] = useState([]); // string[]

  const [saving, setSaving] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    resetValidation();
    setFormErr("");
    setQueuedFiles([]);
    setQueuedUrls([]);
    setImageUrlInput("");

    if (editingProduct) {
      setName(editingProduct.name || "");
      setPrice(String(editingProduct.price ?? ""));
      setStock(String(editingProduct.stock ?? "0"));
      setCategoryId(String(editingProduct.category || categories[0]?.id || ""));
      setDescription(editingProduct.description || "");
      setColorsText(formatListToCsv(editingProduct.available_colors));
      setSizesText(formatListToCsv(editingProduct.available_sizes));
      setExistingImages(
        Array.isArray(editingProduct.images) ? editingProduct.images : []
      );
    } else {
      setName("");
      setPrice("");
      setStock("10");
      setCategoryId(String(categories[0]?.id || ""));
      setDescription("");
      setColorsText("Obsidian Black, Champagne Gold");
      setSizesText("Standard");
      setExistingImages([]);
    }
  }, [isOpen, editingProduct, categories, resetValidation]);

  const handleAttachUrl = async () => {
    const cleanUrl = imageUrlInput.trim();
    if (!cleanUrl) return;
    if (
      !(
        cleanUrl.startsWith("/") ||
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://")
      )
    ) {
      setFormErr("Image path must start with '/', 'http://', or 'https://'.");
      return;
    }
    setFormErr("");

    if (editingProduct?.id) {
      setImgBusy(true);
      try {
        const res = await apiClient.post(
          `/products/${editingProduct.id}/images/`,
          { image: cleanUrl }
        );
        if (res.data) {
          setExistingImages((prev) => [...prev, res.data]);
          setImageUrlInput("");
          onNotify?.("success", "Image attached to product gallery.");
          onSaved?.(false);
        }
      } catch (err) {
        setFormErr(err.response?.data?.detail || "Could not attach image URL.");
      } finally {
        setImgBusy(false);
      }
    } else {
      setQueuedUrls((prev) => [...prev, cleanUrl]);
      setImageUrlInput("");
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setFormErr("");

    if (editingProduct?.id) {
      setImgBusy(true);
      try {
        for (const file of files) {
          const fd = new FormData();
          fd.append("image", file);
          const res = await apiClient.post(
            `/products/${editingProduct.id}/images/`,
            fd
          );
          if (res.data) {
            setExistingImages((prev) => [...prev, res.data]);
          }
        }
        onNotify?.("success", `${files.length} image(s) uploaded to vault gallery.`);
        onSaved?.(false);
      } catch (err) {
        const msg =
          err.response?.data?.uploaded_file?.[0] ||
          err.response?.data?.detail ||
          "Image upload failed. Check file type and 5MB size limit.";
        setFormErr(String(msg));
      } finally {
        setImgBusy(false);
      }
    } else {
      setQueuedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleDeleteExistingImage = async (imgId) => {
    if (!editingProduct?.id || !imgId) return;
    setImgBusy(true);
    try {
      await apiClient.delete(`/products/${editingProduct.id}/images/${imgId}/`);
      setExistingImages((prev) => prev.filter((im) => im.id !== imgId));
      onNotify?.("success", "Image removed from gallery.");
      onSaved?.(false);
    } catch {
      setFormErr("Could not remove image from gallery.");
    } finally {
      setImgBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock) || 0,
        category: Number(categoryId) || categories[0]?.id,
        description: description.trim(),
        available_colors: parseCsvToList(colorsText),
        available_sizes: parseCsvToList(sizesText),
      };

      let savedId = editingProduct?.id;
      if (editingProduct?.id) {
        const res = await apiClient.patch(
          `/products/${editingProduct.id}/`,
          payload
        );
        savedId = res.data?.id || editingProduct.id;
      } else {
        const res = await apiClient.post("/products/", payload);
        savedId = res.data?.id;

        if (savedId) {
          for (const urlStr of queuedUrls) {
            await apiClient.post(`/products/${savedId}/images/`, {
              image: urlStr,
            });
          }
          for (const file of queuedFiles) {
            const fd = new FormData();
            fd.append("image", file);
            await apiClient.post(`/products/${savedId}/images/`, fd);
          }
        }
      }

      onNotify?.(
        "success",
        editingProduct
          ? `Updated catalog piece "${name.trim()}".`
          : `Created new catalog piece "${name.trim()}".`
      );
      onSaved?.(true);
      onClose?.();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.name?.[0] ||
        data?.price?.[0] ||
        "Could not save product record.";
      setFormErr(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="prod-modal-title"
      className="bazaro-dialog bazaro-dialog-md"
    >
      <div
        ref={contentRef}
        data-surface="dark"
        className="w-full max-w-2xl bg-[#140F0C] rounded-[28px] p-6 sm:p-7 border border-[#C59B4B]/40 text-[#FAF5EB] shadow-2xl"
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#C59B4B]/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C59B4B] block">
              {editingProduct ? `Vault SKU #${editingProduct.id}` : "New Listing"}
            </span>
            <h3
              id="prod-modal-title"
              className="font-serif-editorial text-xl font-bold text-[#FAF5EB]"
            >
              {editingProduct ? "Edit Catalog Piece & Gallery" : "Add New Catalog Piece"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product dialog"
            className="bazaro-touch-control p-2 rounded-full bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] cursor-pointer flex items-center justify-center"
          >
            <FiX className="text-base" />
          </button>
        </div>

        {formErr && (
          <p
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-semibold"
          >
            {formErr}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs max-h-[75dvh] overflow-y-auto pr-1">
          <div className="bazaro-field-group">
            <label htmlFor="admin-prod-name" className="text-[#EFE7DA] font-bold block mb-1">
              Product Title *
            </label>
            <input
              id="admin-prod-name"
              type="text"
              autofocus
              required
              placeholder="e.g. Royal Sovereign Chrono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              {...getFieldProps("prodName", {
                errorId: "admin-modal-prod-name-err",
              })}
              className="bazaro-field-input w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
            {fieldErrors.prodName && (
              <p id="admin-modal-prod-name-err" className="bazaro-field-error" data-visible="true">
                {fieldErrors.prodName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bazaro-field-group">
              <label htmlFor="admin-prod-price" className="text-[#EFE7DA] font-bold block mb-1">
                Price ($) *
              </label>
              <input
                id="admin-prod-price"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="99.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                {...getFieldProps("prodPrice", {
                  errorId: "admin-modal-prod-price-err",
                })}
                className="bazaro-field-input w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
              {fieldErrors.prodPrice && (
                <p id="admin-modal-prod-price-err" className="bazaro-field-error" data-visible="true">
                  {fieldErrors.prodPrice}
                </p>
              )}
            </div>

            <div className="bazaro-field-group">
              <label htmlFor="admin-prod-stock" className="text-[#EFE7DA] font-bold block mb-1">
                Stock Units *
              </label>
              <input
                id="admin-prod-stock"
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                {...getFieldProps("prodStock", {
                  errorId: "admin-modal-prod-stock-err",
                })}
                className="bazaro-field-input w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>

            <div>
              <label htmlFor="admin-prod-cat" className="text-[#EFE7DA] font-bold block mb-1">
                Department
              </label>
              <select
                id="admin-prod-cat"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A] capitalize"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-prod-colors" className="text-[#EFE7DA] font-bold block mb-1">
                Finishes / Colors (comma-separated)
              </label>
              <input
                id="admin-prod-colors"
                type="text"
                placeholder="Obsidian Black, Champagne Gold"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>

            <div>
              <label htmlFor="admin-prod-sizes" className="text-[#EFE7DA] font-bold block mb-1">
                Sizes / Editions (comma-separated)
              </label>
              <input
                id="admin-prod-sizes"
                type="text"
                placeholder="S, M, L, XL or 40mm, 42mm"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-prod-desc" className="text-[#EFE7DA] font-bold block mb-1">
              Description
            </label>
            <textarea
              id="admin-prod-desc"
              rows={2}
              placeholder="Specifications, craft notes, warranty..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>

          {/* Multi-Image Gallery Manager */}
          <fieldset className="p-4 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/25 space-y-3">
            <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#E5C77A] flex items-center gap-1.5">
              <FiImage />
              <span>Product Image Gallery</span>
            </legend>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="px-4 py-2.5 rounded-xl bg-[#C59B4B]/15 hover:bg-[#C59B4B]/25 border border-[#C59B4B]/40 text-[#E5C77A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                <FiUpload className="text-xs" />
                <span>{imgBusy ? "Uploading..." : "Upload File(s)"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imgBusy}
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  aria-label="Paste image path or HTTPS URL"
                  placeholder="/products/item.jpg or https://..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                />
                <button
                  type="button"
                  disabled={imgBusy || !imageUrlInput.trim()}
                  onClick={handleAttachUrl}
                  className="px-3.5 py-2 rounded-xl border border-[#C59B4B]/40 bg-[#1A1410] hover:bg-[#C59B4B]/20 text-[#E5C77A] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45"
                >
                  <FiLink className="text-xs" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>

            {/* Existing saved gallery images */}
            {(existingImages.length > 0 || queuedUrls.length > 0 || queuedFiles.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                {existingImages.map((img, i) => (
                  <div
                    key={img.id || i}
                    className="relative group aspect-square rounded-xl bg-[#FAF5EB] p-1 border border-[#C59B4B]/30 overflow-hidden"
                  >
                    <img
                      src={img.image}
                      alt={`Gallery asset ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      disabled={imgBusy}
                      aria-label={`Remove gallery image ${i + 1}`}
                      onClick={() => handleDeleteExistingImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center opacity-90 cursor-pointer shadow"
                    >
                      <FiTrash2 className="text-[11px]" />
                    </button>
                  </div>
                ))}

                {queuedUrls.map((u, idx) => (
                  <div
                    key={`qurl-${idx}`}
                    className="relative aspect-square rounded-xl bg-[#FAF5EB] p-1 border border-emerald-400/50 overflow-hidden"
                  >
                    <img src={u} alt={`Pending URL ${idx + 1}`} className="w-full h-full object-contain" />
                    <button
                      type="button"
                      aria-label={`Remove pending URL ${idx + 1}`}
                      onClick={() => setQueuedUrls((prev) => prev.filter((_, j) => j !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center cursor-pointer"
                    >
                      <FiX className="text-[11px]" />
                    </button>
                  </div>
                ))}

                {queuedFiles.map((file, idx) => (
                  <div
                    key={`qfile-${idx}`}
                    className="relative aspect-square rounded-xl bg-[#1A1410] p-2 border border-emerald-400/40 flex flex-col items-center justify-center text-center"
                  >
                    <FiPlus className="text-[#E5C77A] mb-1" />
                    <span className="text-[10px] text-[#EFE7DA] line-clamp-2 break-all">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove queued file ${file.name}`}
                      onClick={() => setQueuedFiles((prev) => prev.filter((_, j) => j !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center cursor-pointer"
                    >
                      <FiX className="text-[11px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-[#C59B4B]/30 text-[#EFE7DA] font-bold hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bazaro-editorial-btn px-6 py-2.5 rounded-full text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <FiCheck />
              <span>{saving ? "Saving..." : editingProduct ? "Update Piece" : "Save Piece"}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default AdminProductModal;
