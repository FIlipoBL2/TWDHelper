import React from 'react';
import { 
  Sword, 
  Shield, 
  Target, 
  Users, 
  AlertTriangle, 
  CrosshairIcon,
  User,
  UserCheck,
  Zap,
  Activity,
  HomeIcon,
  Dice6,
  UserMinus,
  ShieldCheck,
  ShieldAlert,
  SkullIcon,
  Car,
  Building,
  TreePine,
  Flame,
  BarChart3,
  Package,
  DoorOpen,
  RectangleHorizontal,
  Footprints,
  Crosshair,
  BatteryIcon,
  Compass,
  Database,
  MapPin,
  Heart,
  Zap as BoltIcon,
  Hand
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

// Combat Icons
export const SwordIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Sword className={className} size={size} />
);

export const CrossedSwordsIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Hand className={className} size={size} />
);

export const ShieldIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Shield className={className} size={size} />
);

export const BowIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Target className={className} size={size} />
);

export const SniperIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Crosshair className={className} size={size} />
);

export const RunningIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Footprints className={className} size={size} />
);

export const ActionIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Zap className={className} size={size} />
);

export const VSIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Users className={className} size={size} />
);

// Status Icons
export const WarningIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <AlertTriangle className={className} size={size} />
);

export const ActivityIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Activity className={className} size={size} />
);

export const UserIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <User className={className} size={size} />
);

export const UserCheckIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <UserCheck className={className} size={size} />
);

export const UserMinusIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <UserMinus className={className} size={size} />
);

export const HavenIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <HomeIcon className={className} size={size} />
);

export const DiceIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Dice6 className={className} size={size} />
);

export const DeathIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <SkullIcon className={className} size={size} />
);

// Environment Icons
export const CarIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Car className={className} size={size} />
);

export const BarrelIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <BatteryIcon className={className} size={size} />
);

export const BoxIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Package className={className} size={size} />
);

export const BuildingIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Building className={className} size={size} />
);

export const TreeIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <TreePine className={className} size={size} />
);

export const BarrierIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <BarChart3 className={className} size={size} />
);

export const FireIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <Flame className={className} size={size} />
);

export const DoorIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <DoorOpen className={className} size={size} />
);

export const WindowIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <RectangleHorizontal className={className} size={size} />
);

// Armor Status Icons
export const ArmorIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <ShieldCheck className={className} size={size} />
);

export const CoverIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <ShieldAlert className={className} size={size} />
);

// Action type icons for better visual distinction
export const getMeleeIcon = (className?: string, size = 16) => (
  <SwordIcon className={className} size={size} />
);

export const getRangedIcon = (className?: string, size = 16) => (
  <BowIcon className={className} size={size} />
);

export const getSniperIcon = (className?: string, size = 16) => (
  <SniperIcon className={className} size={size} />
);

export const getShieldIcon = (className?: string, size = 16) => (
  <ShieldIcon className={className} size={size} />
);

export const getAttackIcon = (className?: string, size = 16) => (
  <CrossedSwordsIcon className={className} size={size} />
);

export const getMovementIcon = (className?: string, size = 16) => (
  <RunningIcon className={className} size={size} />
);

export const getActionIcon = (className?: string, size = 16) => (
  <ActionIcon className={className} size={size} />
);

export const getWarningIcon = (className?: string, size = 16) => (
  <WarningIcon className={className} size={size} />
);

export const getCoverIcon = (className?: string, size = 16) => (
  <CoverIcon className={className} size={size} />
);

export const getArmorIcon = (className?: string, size = 16) => (
  <ArmorIcon className={className} size={size} />
);

// Navigation Icons
export const getDiceIcon = (className?: string, size = 16) => (
  <Dice6 className={className} size={size} />
);

export const getCompassIcon = (className?: string, size = 16) => (
  <Compass className={className} size={size} />
);

export const getCharacterIcon = (className?: string, size = 16) => (
  <User className={className} size={size} />
);

export const getDataIcon = (className?: string, size = 16) => (
  <Database className={className} size={size} />
);

export const getHomeIcon = (className?: string, size = 16) => (
  <HomeIcon className={className} size={size} />
);

export const getLocationIcon = (className?: string, size = 16) => (
  <MapPin className={className} size={size} />
);

export const getHealthIcon = (className?: string, size = 16) => (
  <Heart className={className} size={size} />
);
