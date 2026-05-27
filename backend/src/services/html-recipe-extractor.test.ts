import { describe, it, expect } from 'vitest';
import { extractRecipeFromHtml } from './html-recipe-extractor.js';

describe('extractRecipeFromHtml', () => {
  it('should extract ingredients from <li> items', () => {
    const html = `<html>
      <head><meta property="og:title" content="Paella" /></head>
      <body>
        <h2>Ingredientes</h2>
        <ul>
          <li>400 g de arroz bomba</li>
          <li>500 g de pollo</li>
        </ul>
      </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.title).toBe('Paella');
    expect(result.ingredients).toHaveLength(2);
    expect(result.ingredients[0].name).toBe('Arroz bomba');
    expect(result.ingredients[0].quantity).toBe(400);
  });

  it('should extract ingredients from plain text lines', () => {
    const html = `<html><body>
      <h2>Ingredientes para el bizcocho</h2>
      <p>3 huevos</p>
      <p>1 yogur de limón</p>
      <p>2 medidas de azúcar</p>
      <p>3 medidas de harina</p>
      <h2>Preparación</h2>
    </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
    const huevos = result.ingredients.find((i) => i.name.toLowerCase().includes('huevos'));
    expect(huevos).toBeDefined();
    expect(huevos!.quantity).toBe(3);
  });

  it('should extract instructions from numbered steps', () => {
    const html = `<html><body>
      <h2>Cómo hacer el bizcocho</h2>
      <p>1.- Mezclamos los huevos con el azúcar hasta que quede homogéneo.</p>
      <p>&nbsp;</p>
      <p>2.- Añadimos el aceite y el yogur. Mezclamos bien.</p>
      <p>&nbsp;</p>
      <p>3.- Incorporamos la harina tamizada y la levadura.</p>
      <p>4.- Horneamos a 180 grados durante 40 minutos.</p>
    </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.instructions).toBeDefined();
    expect(result.instructions!.split('\n').length).toBeGreaterThanOrEqual(3);
    expect(result.instructions).toContain('Mezclamos');
  });

  it('should extract meta tags for title, description, and image', () => {
    const html = `<html>
      <head>
        <meta property="og:title" content="Mi receta" />
        <meta property="og:description" content="Una receta genial" />
        <meta property="og:image" content="https://example.com/img.jpg" />
      </head>
      <body></body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.title).toBe('Mi receta');
    expect(result.description).toBe('Una receta genial');
    expect(result.imageUrl).toBe('https://example.com/img.jpg');
  });

  it('should detect categories from title keywords', () => {
    const html = `<html>
      <head><meta property="og:title" content="Bizcocho de chocolate" /></head>
      <body></body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.categories).toContain('POSTRE');
  });

  it('should extract times from text patterns', () => {
    const html = `<html><body>
      <p>Tiempo de preparación: 15 minutos</p>
      <p>Tiempo de cocción: 40 minutos</p>
    </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.prepTime).toBe(15);
    expect(result.cookTime).toBe(40);
  });

  it('should extract times from microdata time elements', () => {
    const html = `<html><body>
      <time datetime="PT1H" itemprop="prepTime">1H</time>
    </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.prepTime).toBe(60);
  });

  it('should extract servings from text patterns', () => {
    const html = `<html><body>
      <p>Para 4 personas</p>
    </body></html>`;

    const result = extractRecipeFromHtml(html);
    expect(result.servings).toBe(4);
  });

  it('should handle elmundo-style page with plain text ingredients and numbered steps', () => {
    const html = `<html>
    <head>
      <meta property="og:title" content="Receta de bizcocho casero | Receta de Sergio" />
      <meta property="og:description" content="El bizcocho casero es uno de los clasicos de las madres." />
      <meta property="og:image" content="https://example.com/bizcocho.jpg" />
    </head>
    <body>
      <h2>Que molde usar para el bizcocho</h2>
      <p>En este caso he usado uno de 24 cm.</p>
      <h2>Ingredientes para hacer un bizcocho casero</h2>
      <p>(cuando pongo una medida se refiere a la medida de 1 vaso de yogur)</p>
      <ul>
        <li>3 huevos</li>
        <li>1 yogur de limon</li>
        <li>1 medida de aceite de oliva</li>
        <li>2 medidas de azucar blanco</li>
        <li>3 medidas de harina de trigo</li>
        <li>1 sobre de levadura quimica</li>
        <li>1 ralladura de limon</li>
        <li>3 gramos de sal</li>
      </ul>
      <h2>Como hacer un bizcocho casero</h2>
      <p>1.- Comenzamos mezclando los huevos con el azucar.</p>
      <p>&nbsp;</p>
      <p>2.- Continuamos con el aceite, el yogur y la ralladura del limon. Mezclamos.</p>
      <p>&nbsp;</p>
      <p>3.- Agregamos la harina tamizada y la levadura.</p>
      <p>&nbsp;</p>
      <p>4.- Horneamos a 180 grados durante 40 minutos.</p>
      <div>
        <time datetime="PT1H" itemprop="prepTime">1H</time>
      </div>
    </body></html>`;

    const result = extractRecipeFromHtml(html);

    // Title from og:title
    expect(result.title).toBe('Receta de bizcocho casero | Receta de Sergio');

    // Ingredients from <li> items
    expect(result.ingredients.length).toBeGreaterThanOrEqual(7);
    const huevos = result.ingredients.find((i) => i.name.toLowerCase().includes('huevos'));
    expect(huevos).toBeDefined();
    expect(huevos!.quantity).toBe(3);

    // Instructions from numbered <p> steps
    expect(result.instructions).toBeDefined();
    expect(result.instructions!.split('\\n').length).toBeGreaterThanOrEqual(1);
    expect(result.instructions).toContain('mezclando');

    // Time from microdata
    expect(result.prepTime).toBe(60);

    // Category from title
    expect(result.categories).toContain('POSTRE');

    // Image from og:image
    expect(result.imageUrl).toBe('https://example.com/bizcocho.jpg');
  });
});
