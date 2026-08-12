// Scoped to the marketplace page + shared header for now (per Phase 1 plan,
// the rest of the site stays Spanish-only until this is extracted further).

export type Locale = "es" | "en";

export type Dictionary = {
  nav: {
    login: string;
    signup: string;
    panel: string;
    affiliatePanel: string;
    profile: string;
    logout: string;
  };
  home: {
    title: string;
    subtitle: string;
    filters: {
      city: string;
      listingType: string;
      propertyType: string;
      priceRange: string;
      all: string;
      rent: string;
      sale: string;
      clear: string;
      submit: string;
    };
    agentCard: {
      available: string;
      sold: string;
      new: string;
    };
    empty: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  es: {
    nav: {
      login: "Ingresar",
      signup: "Crear cuenta",
      panel: "Mi Panel",
      affiliatePanel: "Mi Panel",
      profile: "Perfil",
      logout: "Salir",
    },
    home: {
      title: "Encontrá al agente inmobiliario ideal",
      subtitle: "Explorá portafolios de agentes verificados en todo Paraguay",
      filters: {
        city: "Ciudad",
        listingType: "Categoría",
        propertyType: "Tipo de Propiedad",
        priceRange: "Rango de precio",
        all: "Todos",
        rent: "Alquiler",
        sale: "Venta",
        clear: "Limpiar filtros",
        submit: "Filtrar",
      },
      agentCard: {
        available: "disponibles",
        sold: "vendidas",
        new: "Nuevo",
      },
      empty: "No encontramos agentes con esos filtros. Probá con otra búsqueda.",
    },
  },
  en: {
    nav: {
      login: "Log in",
      signup: "Sign up",
      panel: "Agent dashboard",
      affiliatePanel: "Affiliate dashboard",
      profile: "Profile",
      logout: "Log out",
    },
    home: {
      title: "Find the right real estate agent",
      subtitle: "Browse verified agent portfolios across Paraguay",
      filters: {
        city: "City",
        listingType: "Category",
        propertyType: "Property Type",
        priceRange: "Price range",
        all: "All",
        rent: "Rent",
        sale: "Sale",
        clear: "Clear filters",
        submit: "Filter",
      },
      agentCard: {
        available: "available",
        sold: "sold",
        new: "New",
      },
      empty: "No agents match those filters. Try a different search.",
    },
  },
};
