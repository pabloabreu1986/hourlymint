// Iconos del dosier a partir de lucide-react (línea fina, estilo editorial).
// Set curado y agrupado para el selector del editor; el render resuelve por
// nombre. Al estar acotado, el bundle no arrastra los 6000 iconos de lucide.
import {
  CheckCircle, Star, Shield, ShieldCheck, Clock, Home, Zap, Droplet, Ruler,
  Key, Box, Sparkles, Leaf, Plug, Layers, MessageCircle, Camera, Hammer,
  Wrench, Paintbrush, PaintBucket, Lightbulb, Thermometer, Wind, Fan, Sofa,
  Bed, Bath, ShowerHead, CookingPot, Utensils, DoorOpen, Blinds, Lamp, Cpu,
  Wifi, Smartphone, Monitor, Building, Building2, HardHat, Truck, Package,
  Warehouse, PencilRuler, Compass, Scale, BadgeCheck, ThumbsUp, Award, Medal,
  Gem, Crown, Heart, Users, User, Handshake, Phone, Mail, Globe, MapPin,
  Calendar, FileText, ClipboardCheck, ClipboardList, Settings, Scissors,
  Trees, Flower2, Sun, Snowflake, Flame, Recycle, Palette, LayoutGrid,
  Trophy, Target, TrendingUp, Rocket, Eye, Lock, Percent, CreditCard, Euro,
  Tag, Gift, Wallet, Banknote, Receipt, Brush, Grid3x3, Bolt, Droplets,
  type LucideIcon,
} from "lucide-react";

export interface IconoDef {
  nombre: string;
  Comp: LucideIcon;
  /** Categoría para agrupar en el selector. */
  cat: string;
}

// Set curado (nombre = clave estable que se guarda en el dosier).
export const ICONOS: IconoDef[] = [
  // Confianza / garantías
  { nombre: "CheckCircle", Comp: CheckCircle, cat: "Garantías" },
  { nombre: "BadgeCheck", Comp: BadgeCheck, cat: "Garantías" },
  { nombre: "Shield", Comp: Shield, cat: "Garantías" },
  { nombre: "ShieldCheck", Comp: ShieldCheck, cat: "Garantías" },
  { nombre: "Award", Comp: Award, cat: "Garantías" },
  { nombre: "Medal", Comp: Medal, cat: "Garantías" },
  { nombre: "Trophy", Comp: Trophy, cat: "Garantías" },
  { nombre: "Star", Comp: Star, cat: "Garantías" },
  { nombre: "ThumbsUp", Comp: ThumbsUp, cat: "Garantías" },
  { nombre: "Gem", Comp: Gem, cat: "Garantías" },
  { nombre: "Crown", Comp: Crown, cat: "Garantías" },
  { nombre: "Lock", Comp: Lock, cat: "Garantías" },
  // Obra / reforma
  { nombre: "Hammer", Comp: Hammer, cat: "Obra" },
  { nombre: "Wrench", Comp: Wrench, cat: "Obra" },
  { nombre: "Bolt", Comp: Bolt, cat: "Obra" },
  { nombre: "HardHat", Comp: HardHat, cat: "Obra" },
  { nombre: "Ruler", Comp: Ruler, cat: "Obra" },
  { nombre: "PencilRuler", Comp: PencilRuler, cat: "Obra" },
  { nombre: "Compass", Comp: Compass, cat: "Obra" },
  { nombre: "Scale", Comp: Scale, cat: "Obra" },
  { nombre: "Paintbrush", Comp: Paintbrush, cat: "Obra" },
  { nombre: "PaintBucket", Comp: PaintBucket, cat: "Obra" },
  { nombre: "Brush", Comp: Brush, cat: "Obra" },
  { nombre: "Scissors", Comp: Scissors, cat: "Obra" },
  { nombre: "Layers", Comp: Layers, cat: "Obra" },
  { nombre: "Box", Comp: Box, cat: "Obra" },
  { nombre: "Package", Comp: Package, cat: "Obra" },
  { nombre: "Warehouse", Comp: Warehouse, cat: "Obra" },
  { nombre: "Truck", Comp: Truck, cat: "Obra" },
  // Vivienda / confort
  { nombre: "Home", Comp: Home, cat: "Vivienda" },
  { nombre: "Building", Comp: Building, cat: "Vivienda" },
  { nombre: "Building2", Comp: Building2, cat: "Vivienda" },
  { nombre: "DoorOpen", Comp: DoorOpen, cat: "Vivienda" },
  { nombre: "Blinds", Comp: Blinds, cat: "Vivienda" },
  { nombre: "Sofa", Comp: Sofa, cat: "Vivienda" },
  { nombre: "Bed", Comp: Bed, cat: "Vivienda" },
  { nombre: "Bath", Comp: Bath, cat: "Vivienda" },
  { nombre: "ShowerHead", Comp: ShowerHead, cat: "Vivienda" },
  { nombre: "CookingPot", Comp: CookingPot, cat: "Vivienda" },
  { nombre: "Utensils", Comp: Utensils, cat: "Vivienda" },
  { nombre: "Lamp", Comp: Lamp, cat: "Vivienda" },
  { nombre: "Lightbulb", Comp: Lightbulb, cat: "Vivienda" },
  // Instalaciones / clima / tecnología
  { nombre: "Zap", Comp: Zap, cat: "Instalaciones" },
  { nombre: "Plug", Comp: Plug, cat: "Instalaciones" },
  { nombre: "Droplet", Comp: Droplet, cat: "Instalaciones" },
  { nombre: "Droplets", Comp: Droplets, cat: "Instalaciones" },
  { nombre: "Thermometer", Comp: Thermometer, cat: "Instalaciones" },
  { nombre: "Wind", Comp: Wind, cat: "Instalaciones" },
  { nombre: "Fan", Comp: Fan, cat: "Instalaciones" },
  { nombre: "Sun", Comp: Sun, cat: "Instalaciones" },
  { nombre: "Snowflake", Comp: Snowflake, cat: "Instalaciones" },
  { nombre: "Flame", Comp: Flame, cat: "Instalaciones" },
  { nombre: "Cpu", Comp: Cpu, cat: "Instalaciones" },
  { nombre: "Wifi", Comp: Wifi, cat: "Instalaciones" },
  { nombre: "Smartphone", Comp: Smartphone, cat: "Instalaciones" },
  { nombre: "Monitor", Comp: Monitor, cat: "Instalaciones" },
  { nombre: "Camera", Comp: Camera, cat: "Instalaciones" },
  { nombre: "Recycle", Comp: Recycle, cat: "Instalaciones" },
  { nombre: "Leaf", Comp: Leaf, cat: "Instalaciones" },
  { nombre: "Trees", Comp: Trees, cat: "Instalaciones" },
  { nombre: "Flower2", Comp: Flower2, cat: "Instalaciones" },
  // Proceso / contacto / negocio
  { nombre: "Clock", Comp: Clock, cat: "General" },
  { nombre: "Calendar", Comp: Calendar, cat: "General" },
  { nombre: "ClipboardCheck", Comp: ClipboardCheck, cat: "General" },
  { nombre: "ClipboardList", Comp: ClipboardList, cat: "General" },
  { nombre: "FileText", Comp: FileText, cat: "General" },
  { nombre: "Settings", Comp: Settings, cat: "General" },
  { nombre: "Target", Comp: Target, cat: "General" },
  { nombre: "TrendingUp", Comp: TrendingUp, cat: "General" },
  { nombre: "Rocket", Comp: Rocket, cat: "General" },
  { nombre: "Eye", Comp: Eye, cat: "General" },
  { nombre: "Sparkles", Comp: Sparkles, cat: "General" },
  { nombre: "Palette", Comp: Palette, cat: "General" },
  { nombre: "LayoutGrid", Comp: LayoutGrid, cat: "General" },
  { nombre: "Grid3x3", Comp: Grid3x3, cat: "General" },
  { nombre: "Key", Comp: Key, cat: "General" },
  { nombre: "MessageCircle", Comp: MessageCircle, cat: "General" },
  { nombre: "Phone", Comp: Phone, cat: "Contacto" },
  { nombre: "Mail", Comp: Mail, cat: "Contacto" },
  { nombre: "Globe", Comp: Globe, cat: "Contacto" },
  { nombre: "MapPin", Comp: MapPin, cat: "Contacto" },
  { nombre: "Users", Comp: Users, cat: "Contacto" },
  { nombre: "User", Comp: User, cat: "Contacto" },
  { nombre: "Handshake", Comp: Handshake, cat: "Contacto" },
  { nombre: "Heart", Comp: Heart, cat: "Contacto" },
  // Pagos
  { nombre: "Percent", Comp: Percent, cat: "Pagos" },
  { nombre: "CreditCard", Comp: CreditCard, cat: "Pagos" },
  { nombre: "Euro", Comp: Euro, cat: "Pagos" },
  { nombre: "Wallet", Comp: Wallet, cat: "Pagos" },
  { nombre: "Banknote", Comp: Banknote, cat: "Pagos" },
  { nombre: "Receipt", Comp: Receipt, cat: "Pagos" },
  { nombre: "Tag", Comp: Tag, cat: "Pagos" },
  { nombre: "Gift", Comp: Gift, cat: "Pagos" },
];

const MAPA: Record<string, LucideIcon> = Object.fromEntries(ICONOS.map((i) => [i.nombre, i.Comp]));

/** Resuelve un icono por nombre; si no existe, un check por defecto. */
export function resolverIcono(nombre?: string | null): LucideIcon {
  return (nombre && MAPA[nombre]) || CheckCircle;
}

// Iconos por defecto asignados por posición (items sin icono explícito).
const DEFAULTS = [
  "CheckCircle", "Star", "Shield", "Clock", "Home", "Zap", "Droplet", "Ruler",
  "Key", "Box", "Sparkles", "Leaf", "Plug", "Layers", "MessageCircle", "Camera",
];

/** Nombre del icono por defecto según la posición del ítem. */
export function iconoDefectoPorIndice(i: number): string {
  return DEFAULTS[i % DEFAULTS.length];
}

/** Componente del icono por defecto según posición (compat con el render). */
export function iconoPorIndice(i: number): LucideIcon {
  return resolverIcono(iconoDefectoPorIndice(i));
}
