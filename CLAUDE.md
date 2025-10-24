# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALE DEAL is a Spanish-language e-commerce marketplace website targeting the Argentine market. It features a modern Bootstrap-based frontend with user authentication, shopping cart functionality, and product browsing capabilities.

## Technology Stack

- **Frontend Framework**: Bootstrap 5.3.5
- **Icons**: Bootstrap Icons 1.11.3
- **Animations**: AOS (Animate On Scroll) library
- **Language**: Spanish (es-AR)
- **Currency**: Argentine Peso (ARS)

## Architecture

### File Structure
```
/
├── index.html              # Main homepage with product grid
├── HTML/                   # Authentication pages
│   ├── login.html         # User login form
│   ├── signup.html        # User registration form
│   └── producto.html      # Product detail page
├── CSS/                   # Stylesheets organized by type
│   ├── variables.css      # Global CSS variables and design tokens
│   ├── components.css     # Reusable UI components
│   ├── product-page.css   # Product-specific styles
│   └── pages/             # Page-specific styles
│       ├── auth.css       # Authentication pages
│       ├── home.css       # Homepage styles
│       └── product.css    # Product page styles
├── JS/                    # JavaScript modules
│   ├── utils.js          # Global utilities and configuration
│   ├── auth.js           # Authentication system (login/register)
│   ├── cart.js           # Shopping cart management
│   ├── dropdown-fix.js   # Bootstrap dropdown fixes
│   └── pages/            # Page-specific scripts
│       ├── home.js       # Homepage functionality
│       └── product.js    # Product page functionality
└── IMG/                  # Image assets
    ├── LOGO.png
    ├── LOGO-2.png
    └── fondo.png
```

### Core Systems

**Authentication System (auth.js)**
- Unified AuthManager class handling login/registration
- LocalStorage-based session management
- Form validation with real-time feedback
- Password strength checking
- Email remember functionality

**Shopping Cart (cart.js)**
- CartManager class for cart operations
- LocalStorage persistence
- Real-time badge updates
- Product quantity management

**Global Configuration (utils.js)**
- DaleDeal namespace with global config
- Currency formatting for Argentine Peso
- API configuration and constants
- Responsive breakpoint definitions

### CSS Architecture

**Design System**
- CSS custom properties in variables.css
- Brand colors: Primary red (#d63031) and yellow (#ff8000)
- Comprehensive gray scale and state colors
- Typography system with Inter font family
- Consistent spacing and sizing scales

**Component Structure**
- Modular CSS organization
- Page-specific stylesheets
- Bootstrap customization through CSS variables
- Responsive design with mobile-first approach

## Development Workflow

### Static Development
This is a static website that can be served using any local web server:
- **Python**: `python -m http.server 8000`
- **VS Code**: Use Live Server extension
- **Node.js**: `npx serve .`

### File Serving
All paths are relative to the root directory. The site uses:
- Relative path navigation between pages
- CDN resources for Bootstrap and external libraries
- Local asset management for images and custom code

## Important Notes

- All content is in Spanish targeting Argentine users
- Currency formatting uses Argentine Peso (ARS)
- Authentication is simulated (no backend API)
- Cart data persists in localStorage
- The site uses Bootstrap 5.3.5 for responsive design
- No build process required - direct file serving