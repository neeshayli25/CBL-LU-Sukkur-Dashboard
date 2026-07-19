import React from 'react';
import { 
  AlertTriangle, 
  Target, 
  FileWarning, 
  CheckSquare, 
  Users, 
  Briefcase 
} from 'lucide-react';

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  Target,
  FileWarning,
  CheckSquare,
  Users,
  Briefcase
};
