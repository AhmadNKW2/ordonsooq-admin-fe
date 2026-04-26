"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import type { Note } from "../../services/notes/types/note.types";
import { STOREFRONT_CONFIG } from "../../lib/constants";
import { ExternalLink, User, Mail, Phone, ShoppingBag, MessageSquare, Clock, Edit } from "lucide-react";

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

export function NoteViewModal({ isOpen, onClose, note }: NoteViewModalProps) {
  if (!note) return null;

  const product = note.product;
  const productName = product?.name_en || product?.name || "Unknown Product";
  
  const primaryMedia = (product as any)?.media?.find((m: any) => m.is_primary) || (product as any)?.media?.[0];
  const productImage = product?.image || primaryMedia?.url || product?.primary_image?.url || "https://placehold.co/400x400?text=No+Image";
  const productSlug = product?.slug || product?.id;

  const customerName = note.guest_name || ((note as any).user ? `${(note as any).user.firstName} ${(note as any).user.lastName}` : `User ID: ${note.user_id}`) || "Unknown Customer";
  const customerPhone = note.guest_phone || (note as any).user?.phone || "Not provided";
  const customerEmail = note.guest_email || (note as any).user?.email || "Not provided";

  const handlePreview = () => {
    if (!productSlug) return;
    window.open(
      `${STOREFRONT_CONFIG.baseUrl}/products/${productSlug}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const formattedDate = note.created_at 
    ? new Date(note.created_at).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!p-0 max-w-4xl w-[95vw] md:w-[85vw] lg:w-[75vw] overflow-hidden rounded-2xl relative">
      <div className="w-full flex flex-col">
        {/* Header Area */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 md:px-8 py-5 border-b border-gray-100 flex justify-between items-start w-full pr-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Customer Note</h2>
              {formattedDate && (
                <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formattedDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full px-5 md:px-5 py-5 bg-white grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-5 max-h-[75vh] overflow-y-auto">
        
        {/* Left Sidebar (Customer & Product) */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-5">
          
          {/* Customer Card */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                <User className="w-4 h-4 text-gray-400" />
                Contact Info
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pl-0.5 mb-1">Name</p>
                <div className="text-sm font-medium text-gray-900 bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-50">{customerName}</div>
              </div>
              
              {customerEmail !== "Not provided" && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pl-0.5 mb-1">Email</p>
                  <a href={`mailto:${customerEmail}`} className="text-sm font-medium text-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-lg px-3 py-2 border border-blue-50/50 flex flex-wrap items-center gap-2 transition-colors break-all">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {customerEmail}
                  </a>
                </div>
              )}
              
              {customerPhone !== "Not provided" && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pl-0.5 mb-1">Phone</p>
                  <a href={`tel:${customerPhone}`} className="text-sm font-medium text-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-lg px-3 py-2 border border-blue-50/50 flex flex-wrap items-center gap-2 transition-colors">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Product Card */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
            <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                <ShoppingBag className="w-4 h-4 text-gray-400" />
                Referenced Product
              </h3>
            </div>
            <div className="p-5 flex flex-col items-center justify-center flex-1">
              <div className="w-32 h-32 mb-5 relative rounded-xl border border-gray-100 p-2 shadow-sm bg-white">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[13px] font-semibold text-gray-800 text-center line-clamp-3 mb-5 leading-relaxed" title={productName}>
                {productName}
              </p>
              
              <div className="w-full flex flex-col gap-2 mt-auto">
                <Button
                  variant="solid"
                  href={product?.id ? `/products/${product.id}` : '#'}
                  className="w-full h-[42px] text-[13px] font-bold flex items-center justify-center pt-0 pb-0"
                  disabled={!product?.id}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
                
                <Button
                  variant="outline"
                  color="#6b7280"
                  className="w-full h-[42px] text-[13px] font-bold border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900! transition-colors flex items-center justify-center pt-0 pb-0"
                  onClick={handlePreview}
                  disabled={!productSlug}
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
                  Preview in Store
                </Button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Content (The Note) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full">
          <div className="flex-1 rounded-xl border border-[#eed067] bg-[#fffcf0] shadow-[0_4px_15px_-4px_rgba(238,208,103,0.3)] flex flex-col overflow-hidden relative">
            {/* Soft decorative tape effect at the top */}
            <div className="absolute top-0 inset-x-0 h-5 bg-linear-to-b from-[#f2e2a9]/80 to-transparent"></div>
            
            <div className="px-6 py-4 flex items-center gap-2 border-b border-[#f2e2a9] bg-[#fffcf0]/50 z-10">
               <MessageSquare className="w-4 h-4 text-amber-600" />
               <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest">Message Content</h3>
            </div>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto z-10">
              <div className="flex flex-col gap-1.5">
                {(note.notes || "No content provided in this note.").split('\n').map((line, i) => (
                  <p 
                    key={i}
                    dir="auto"
                    className="text-gray-800 text-[15px] leading-relaxed font-medium font-sans m-0"
                    style={{ wordBreak: 'break-word', minHeight: line.trim() === '' ? '1.5rem' : 'auto' }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
     </div>
    </Modal>
  );
}
