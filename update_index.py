#!/usr/bin/env python3
import re

# Read the current file
with open('frontend/src/pages/Index.tsx', 'r') as f:
    content = f.read()

# Add ChevronDown to imports
content = content.replace(
    "import { Camera, List, Upload, Utensils, ChefHat, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';",
    "import { Camera, List, Upload, Utensils, ChefHat, Plus, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';"
)

# Add useAuth import after Swal
content = content.replace(
    "import Swal from 'sweetalert2';",
    "import Swal from 'sweetalert2';\nimport { useAuth } from '@/lib/utils';"
)

# Add useAuth hook and viewMode state
content = content.replace(
    "const { toast } = useToast();",
    "const { toast } = useToast();\n  const { user } = useAuth();\n  const [viewMode, setViewMode] = useState<'active' | 'saved'>('active');"
)

# Write back
with open('frontend/src/pages/Index.tsx', 'w') as f:
    f.write(content)

print("Done updating imports and state!")

