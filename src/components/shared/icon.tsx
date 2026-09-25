"use client";

import {
  LayoutDashboard, TrendingUp, TrendingDown, ReceiptText, Users, CalendarDays,
  FileText, BarChart3, Globe, ShoppingBag, MessageSquareWarning, Megaphone,
  Network, Send, Link2, Settings, Home, Bell, Menu, X, Search, Plus, ChevronRight,
  ChevronLeft, User, Phone, MapPin, Camera, Image, Paperclip, Trash2, Edit,
  Eye, Download, Share2, Printer, Check, Clock, AlertTriangle, Info, Filter,
  ChevronDown, MessageCircle, Youtube, Instagram, Facebook, ExternalLink,
  Wallet, Coins, ArrowRight, ArrowLeft, MoreVertical, CheckCircle2, CircleDot,
  Building2, MapPinned, Calendar, Upload, Loader2, RefreshCw, Star, Pencil,
  Sun, Moon, LogOut, UserCog, Shield, Sparkles, ArrowUpRight, ArrowDownRight,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, TrendingUp, TrendingDown, ReceiptText, Users, CalendarDays,
  FileText, BarChart3, Globe, ShoppingBag, MessageSquareWarning, Megaphone,
  Network, Send, Link2, Settings, Home, Bell, Menu, X, Search, Plus, ChevronRight,
  ChevronLeft, User, Phone, MapPin, Camera, Image, Paperclip, Trash2, Edit,
  Eye, Download, Share2, Printer, Check, Clock, AlertTriangle, Info, Filter,
  ChevronDown, MessageCircle, Youtube, Instagram, Facebook, ExternalLink,
  Wallet, Coins, ArrowRight, ArrowLeft, MoreVertical, CheckCircle2, CircleDot,
  Building2, MapPinned, Calendar, Upload, Loader2, RefreshCw, Star, Pencil,
  Sun, Moon, LogOut, UserCog, Shield, Sparkles, ArrowUpRight, ArrowDownRight,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] || CircleDot;
  return <Cmp className={className} />;
}
