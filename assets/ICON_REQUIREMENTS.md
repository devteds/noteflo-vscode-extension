# NoteFlo Extension Icon Requirements

## 📋 **Icon Specifications**

### **Required:**
- **Format**: PNG
- **Size**: 256x256 pixels minimum (512x512 recommended)  
- **Filename**: `noteflo-icon.png` (as specified in package.json)
- **Background**: Should work on both light and dark themes

### **Design Guidelines:**
- **Simple & Clean**: Should be recognizable at small sizes (16x16, 32x32)
- **Relevant**: Should represent time tracking, notes, or workflow
- **Professional**: Matches the extension's business/consulting focus
- **Unique**: Distinguishable from other extensions

## 🎨 **Design Ideas for NoteFlo**

### **Concept 1: Clock + Notes**
- Combination of clock/timer with notepad/document icon
- Colors: Blue (#007ACC - VS Code theme) + accent color

### **Concept 2: Workflow Symbol**
- Abstract representation of workflow (arrows, steps, checklist)
- Minimalist design with professional colors

### **Concept 3: "NF" Monogram**
- Stylized "NF" letters with subtle time/productivity elements
- Clean typography-based approach

## 🛠 **How to Get Your Icon**

### **Option 1: Create Your Own**
**Free Tools:**
- **Canva**: [canva.com](https://canva.com) - Templates for logos/icons
- **GIMP**: [gimp.org](https://gimp.org) - Free image editor
- **Figma**: [figma.com](https://figma.com) - Professional design tool

**Design Process:**
1. Start with 512x512 canvas
2. Use simple shapes and minimal colors
3. Test at smaller sizes (64x64, 32x32, 16x16)
4. Export as PNG with transparent background if needed

### **Option 2: Professional Designer**
**Platforms:**
- **Fiverr**: $5-50 for simple icon design
- **99designs**: Contest-based design
- **Upwork**: Hire individual designers
- **Dribbble**: Browse and hire designers

### **Option 3: Icon Libraries**
**Free Options:**
- **Heroicons**: [heroicons.com](https://heroicons.com)
- **Feather Icons**: [feathericons.com](https://feathericons.com)
- **Tabler Icons**: [tabler-icons.io](https://tabler-icons.io)

**Premium Options:**
- **Noun Project**: [thenounproject.com](https://thenounproject.com)
- **IconFinder**: [iconfinder.com](https://iconfinder.com)

*Note: Ensure you have proper licensing for commercial use*

## 📐 **Icon Placement**

Once you have your icon:
1. Save as `assets/noteflo-icon.png`
2. Ensure it's 256x256 or 512x512 pixels
3. Test by packaging: `npm run package-vsix`
4. Republish: `npm run publish`

## 🎯 **Current Status**

- ✅ **package.json updated** with icon path
- ✅ **assets directory created**
- ⏳ **Icon file needed**: `assets/noteflo-icon.png`

## 🔄 **After Adding Icon**

The next publish will include your custom icon instead of the default VS Code icon shown in the marketplace.

---

*Need help with icon creation? Consider it part of the professional branding for Devteds!* 