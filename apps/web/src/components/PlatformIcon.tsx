import { SocialPlatform } from '../types/scheduler';
import { Instagram, Facebook, Linkedin, Video } from 'lucide-react';

interface PlatformIconProps {
  platform: SocialPlatform | string;
  className?: string;
}

export default function PlatformIcon({ platform, className = 'h-4 w-4' }: PlatformIconProps) {
  switch (platform.toUpperCase()) {
    case 'INSTAGRAM':
      return <Instagram className={`${className} text-pink-400`} />;
    case 'FACEBOOK':
      return <Facebook className={`${className} text-blue-400`} />;
    case 'LINKEDIN':
      return <Linkedin className={`${className} text-sky-400`} />;
    case 'TIKTOK':
      return <Video className={`${className} text-teal-400`} />;
    default:
      return <div className={`${className} rounded-full bg-zinc-700`} />;
  }
}
