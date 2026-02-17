// Generates seed SQL for all French departments (3 cities each)
// Run: node supabase/generate_seed.js > supabase/seed_all_departments.sql

const departments = [
  // [dept_code, dept_name, [city1, city2, city3]]
  // Each city: [insee, zipcode, name, lat, lng, stability, mayor, elections]
  // Each election: [year, nuance, winner_name, score, turnout]

  ['01', 'Ain', [
    ['01053', '01000', 'Bourg-en-Bresse', 46.2056, 5.2289, 'STABLE', 'Jean-François Debat', [
      [2020, 'G', 'Jean-François Debat', 52.1, 41.2], [2014, 'G', 'Jean-François Debat', 50.8, 55.3], [2008, 'D', 'Jean-François Angot', 51.4, 59.1]
    ]],
    ['01283', '01100', 'Oyonnax', 46.2569, 5.6556, 'SWING', 'Michel Perraud', [
      [2020, 'D', 'Michel Perraud', 55.3, 38.7], [2014, 'G', 'Michel Perraud', 48.2, 54.1], [2008, 'G', 'Alain Mérieux', 52.1, 57.8]
    ]],
    ['01004', '01500', 'Ambérieu-en-Bugey', 45.9606, 5.3728, 'STABLE', 'Daniel Fabre', [
      [2020, 'D', 'Daniel Fabre', 54.7, 40.5], [2014, 'D', 'Daniel Fabre', 56.2, 53.8], [2008, 'G', 'Jacques Finas', 50.3, 58.2]
    ]],
  ]],
  ['02', 'Aisne', [
    ['02691', '02100', 'Saint-Quentin', 49.8467, 3.2875, 'SWING', 'Frédérique Macarez', [
      [2020, 'D', 'Frédérique Macarez', 60.2, 35.8], [2014, 'D', 'Frédérique Macarez', 52.1, 52.4], [2008, 'G', 'Pierre André', 47.8, 56.1]
    ]],
    ['02408', '02000', 'Laon', 49.5639, 3.6244, 'STABLE', 'Éric Delhaye', [
      [2020, 'G', 'Éric Delhaye', 51.3, 37.4], [2014, 'G', 'Antoine Lefèvre', 48.9, 53.7], [2008, 'D', 'Antoine Lefèvre', 53.2, 57.5]
    ]],
    ['02722', '02200', 'Soissons', 49.3817, 3.3236, 'SWING', 'Alain Crémont', [
      [2020, 'D', 'Alain Crémont', 55.8, 36.2], [2014, 'G', 'Patrick Day', 49.1, 51.8], [2008, 'G', 'Patrick Day', 52.4, 56.3]
    ]],
  ]],
  ['03', 'Allier', [
    ['03190', '03000', 'Moulins', 46.5667, 3.3333, 'SWING', 'Pierre-André Périssol', [
      [2020, 'D', 'Pierre-André Périssol', 53.4, 39.8], [2014, 'D', 'Pierre-André Périssol', 55.2, 54.1], [2008, 'G', 'Jean-Paul Dufour', 50.7, 57.6]
    ]],
    ['03185', '03100', 'Montluçon', 46.3397, 2.6033, 'STABLE', 'Frédéric Laporte', [
      [2020, 'G', 'Frédéric Laporte', 55.1, 38.4], [2014, 'G', 'Daniel Dugléry', 51.8, 52.7], [2008, 'G', 'Daniel Dugléry', 54.3, 56.8]
    ]],
    ['03310', '03200', 'Vichy', 46.1264, 3.4267, 'STABLE', 'Frédéric Aguilera', [
      [2020, 'D', 'Frédéric Aguilera', 58.3, 40.2], [2014, 'D', 'Claude Malhuret', 62.1, 55.4], [2008, 'D', 'Claude Malhuret', 59.7, 58.1]
    ]],
  ]],
  ['04', 'Alpes-de-Haute-Provence', [
    ['04070', '04000', 'Digne-les-Bains', 44.0928, 6.2361, 'STABLE', 'Patricia Granet-Brunello', [
      [2020, 'G', 'Patricia Granet-Brunello', 52.8, 42.1], [2014, 'G', 'Serge Gloaguen', 50.4, 54.8], [2008, 'G', 'Serge Gloaguen', 53.1, 57.2]
    ]],
    ['04112', '04100', 'Manosque', 43.8328, 5.7869, 'SWING', 'Jean-Yves Roux', [
      [2020, 'G', 'Jean-Yves Roux', 48.7, 39.5], [2014, 'D', 'Bernard Jeanmet-Pérès', 51.2, 53.1], [2008, 'G', 'Daniel Rolland', 50.8, 56.9]
    ]],
    ['04209', '04200', 'Sisteron', 44.1981, 5.9419, 'STABLE', 'Daniel Spagnou', [
      [2020, 'D', 'Daniel Spagnou', 57.3, 41.8], [2014, 'D', 'Daniel Spagnou', 59.8, 55.2], [2008, 'D', 'Daniel Spagnou', 55.4, 58.7]
    ]],
  ]],
  ['05', 'Hautes-Alpes', [
    ['05061', '05000', 'Gap', 44.5594, 6.0806, 'SWING', 'Roger Didier', [
      [2020, 'C', 'Roger Didier', 51.2, 40.3], [2014, 'D', 'Roger Didier', 54.8, 54.1], [2008, 'D', 'Roger Didier', 52.3, 57.8]
    ]],
    ['05023', '05100', 'Briançon', 44.8964, 6.6364, 'STABLE', 'Arnaud Murgia', [
      [2020, 'D', 'Arnaud Murgia', 55.7, 42.8], [2014, 'D', 'Gérard Fromm', 53.1, 55.6], [2008, 'G', 'Gérard Fromm', 50.2, 58.3]
    ]],
    ['05046', '05200', 'Embrun', 44.5636, 6.4956, 'STABLE', 'Chantal Eyméoud', [
      [2020, 'C', 'Chantal Eyméoud', 54.3, 43.5], [2014, 'C', 'Chantal Eyméoud', 52.8, 56.2], [2008, 'D', 'Jean Bléou', 51.1, 59.1]
    ]],
  ]],
  ['06', 'Alpes-Maritimes', [
    ['06088', '06000', 'Nice', 43.7102, 7.2620, 'FORTRESS', 'Christian Estrosi', [
      [2020, 'D', 'Christian Estrosi', 59.4, 38.2], [2014, 'D', 'Christian Estrosi', 64.8, 52.7], [2008, 'D', 'Christian Estrosi', 58.1, 55.9]
    ]],
    ['06029', '06400', 'Cannes', 43.5513, 7.0128, 'FORTRESS', 'David Lisnard', [
      [2020, 'D', 'David Lisnard', 78.3, 37.5], [2014, 'D', 'David Lisnard', 65.2, 51.8], [2008, 'D', 'Bernard Brochand', 62.4, 54.6]
    ]],
    ['06004', '06600', 'Antibes', 43.5808, 7.1239, 'FORTRESS', 'Jean Leonetti', [
      [2020, 'D', 'Jean Leonetti', 61.7, 39.1], [2014, 'D', 'Jean Leonetti', 59.3, 53.4], [2008, 'D', 'Jean Leonetti', 57.8, 56.2]
    ]],
  ]],
  ['07', 'Ardèche', [
    ['07186', '07000', 'Privas', 44.7356, 4.5986, 'STABLE', 'Michel Valla', [
      [2020, 'G', 'Michel Valla', 53.2, 43.7], [2014, 'G', 'Michel Valla', 51.8, 56.3], [2008, 'G', 'Pascal Terrasse', 55.1, 59.2]
    ]],
    ['07019', '07200', 'Aubenas', 44.6197, 4.3906, 'SWING', 'Jean-Esprit Veyret', [
      [2020, 'G', 'Jean-Esprit Veyret', 50.3, 41.2], [2014, 'D', 'Jean-Esprit Veyret', 52.7, 55.8], [2008, 'G', 'Michel Pouzol', 49.8, 58.1]
    ]],
    ['07010', '07100', 'Annonay', 45.2397, 4.6706, 'STABLE', 'Simon Plénet', [
      [2020, 'G', 'Simon Plénet', 55.8, 40.8], [2014, 'G', 'Olivier Dussopt', 58.2, 54.1], [2008, 'G', 'Olivier Dussopt', 53.7, 57.6]
    ]],
  ]],
  ['08', 'Ardennes', [
    ['08105', '08000', 'Charleville-Mézières', 49.7719, 4.7203, 'SWING', 'Boris Ravignon', [
      [2020, 'D', 'Boris Ravignon', 54.8, 36.1], [2014, 'D', 'Boris Ravignon', 51.2, 50.8], [2008, 'G', 'Claudine Ledoux', 52.3, 55.7]
    ]],
    ['08409', '08200', 'Sedan', 49.7019, 4.9403, 'STABLE', 'Didier Herbillon', [
      [2020, 'G', 'Didier Herbillon', 53.1, 34.8], [2014, 'G', 'Didier Herbillon', 50.7, 49.2], [2008, 'G', 'Didier Herbillon', 54.2, 54.1]
    ]],
    ['08362', '08300', 'Rethel', 49.5094, 4.3650, 'STABLE', 'Noël Bourgeois', [
      [2020, 'D', 'Noël Bourgeois', 56.3, 38.5], [2014, 'D', 'Pierre Favre', 54.8, 52.4], [2008, 'D', 'Pierre Favre', 52.1, 56.8]
    ]],
  ]],
  ['09', 'Ariège', [
    ['09122', '09000', 'Foix', 42.9653, 1.6053, 'FORTRESS', 'Norbert Meler', [
      [2020, 'G', 'Norbert Meler', 57.8, 43.2], [2014, 'G', 'Norbert Meler', 55.4, 56.8], [2008, 'G', 'Norbert Meler', 53.1, 59.7]
    ]],
    ['09225', '09100', 'Pamiers', 43.1167, 1.6108, 'STABLE', 'André Trigano', [
      [2020, 'G', 'André Trigano', 51.2, 41.5], [2014, 'G', 'André Trigano', 54.8, 55.2], [2008, 'D', 'André Trigano', 49.3, 58.4]
    ]],
    ['09261', '09200', 'Saint-Girons', 42.9847, 1.1456, 'FORTRESS', 'Jean-Michel Faup', [
      [2020, 'G', 'Jean-Michel Faup', 54.7, 42.8], [2014, 'G', 'Laurent Music', 52.3, 54.1], [2008, 'G', 'Laurent Music', 56.1, 57.9]
    ]],
  ]],
  ['10', 'Aube', [
    ['10387', '10000', 'Troyes', 48.2973, 4.0744, 'SWING', 'François Baroin', [
      [2020, 'D', 'François Baroin', 62.8, 38.7], [2014, 'D', 'François Baroin', 67.3, 53.1], [2008, 'G', 'François Baroin', 45.2, 56.8]
    ]],
    ['10323', '10100', 'Romilly-sur-Seine', 48.5131, 3.7267, 'SWING', 'Marie-Louise Fort', [
      [2020, 'D', 'Marie-Louise Fort', 55.1, 35.2], [2014, 'D', 'Marie-Louise Fort', 52.8, 49.7], [2008, 'G', 'Jean Auroux', 50.3, 54.6]
    ]],
    ['10033', '10200', 'Bar-sur-Aube', 48.2372, 4.7069, 'STABLE', 'Philippe Borde', [
      [2020, 'D', 'Philippe Borde', 58.4, 40.1], [2014, 'D', 'Philippe Borde', 55.7, 52.8], [2008, 'D', 'Philippe Borde', 53.2, 56.4]
    ]],
  ]],
  ['11', 'Aude', [
    ['11069', '11000', 'Carcassonne', 43.2130, 2.3491, 'STABLE', 'Gérard Larrat', [
      [2020, 'D', 'Gérard Larrat', 54.2, 41.8], [2014, 'D', 'Gérard Larrat', 52.1, 55.4], [2008, 'G', 'Jean-Claude Pérez', 51.7, 58.2]
    ]],
    ['11262', '11100', 'Narbonne', 43.1842, 3.0033, 'SWING', 'Didier Mouly', [
      [2020, 'G', 'Didier Mouly', 48.3, 39.5], [2014, 'G', 'Didier Mouly', 50.8, 53.7], [2008, 'D', 'Jacques Bascou', 46.2, 57.1]
    ]],
    ['11076', '11400', 'Castelnaudary', 43.3178, 1.9544, 'FORTRESS', 'Patrick Maugard', [
      [2020, 'G', 'Patrick Maugard', 55.7, 43.2], [2014, 'G', 'Patrick Maugard', 53.4, 56.1], [2008, 'G', 'Patrick Maugard', 57.2, 59.8]
    ]],
  ]],
  ['12', 'Aveyron', [
    ['12202', '12000', 'Rodez', 44.3497, 2.5750, 'SWING', 'Christian Teyssèdre', [
      [2020, 'G', 'Christian Teyssèdre', 52.4, 42.7], [2014, 'G', 'Christian Teyssèdre', 50.1, 55.8], [2008, 'D', 'Marc Censi', 53.8, 58.4]
    ]],
    ['12145', '12100', 'Millau', 44.0986, 3.0781, 'STABLE', 'Emmanuelle Gazel', [
      [2020, 'G', 'Emmanuelle Gazel', 55.2, 41.3], [2014, 'G', 'Christophe Saint-Pierre', 52.7, 54.6], [2008, 'G', 'Christophe Saint-Pierre', 54.1, 57.9]
    ]],
    ['12300', '12200', 'Villefranche-de-Rouergue', 44.3517, 2.0375, 'STABLE', 'Jean-Sébastien Orcibal', [
      [2020, 'D', 'Jean-Sébastien Orcibal', 56.8, 43.5], [2014, 'D', 'Serge Roques', 54.3, 56.2], [2008, 'D', 'Serge Roques', 51.7, 59.1]
    ]],
  ]],
  ['13', 'Bouches-du-Rhône', [
    ['13055', '13001', 'Marseille', 43.2965, 5.3698, 'SWING', 'Benoît Payan', [
      [2020, 'G', 'Michèle Rubirola/Benoît Payan', 51.2, 36.8], [2014, 'D', 'Jean-Claude Gaudin', 58.4, 50.3], [2008, 'D', 'Jean-Claude Gaudin', 55.7, 53.1]
    ]],
    ['13001', '13100', 'Aix-en-Provence', 43.5297, 5.4474, 'FORTRESS', 'Sophie Joissains', [
      [2020, 'D', 'Sophie Joissains', 56.3, 39.4], [2014, 'CD', 'Maryse Joissains', 61.2, 52.8], [2008, 'CD', 'Maryse Joissains', 58.7, 55.6]
    ]],
    ['13004', '13200', 'Arles', 43.6767, 4.6278, 'SWING', 'Patrick de Carolis', [
      [2020, 'D', 'Patrick de Carolis', 48.7, 38.2], [2014, 'G', 'Hervé Schiavetti', 52.1, 51.4], [2008, 'G', 'Hervé Schiavetti', 55.3, 54.8]
    ]],
  ]],
  ['14', 'Calvados', [
    ['14118', '14000', 'Caen', 49.1829, -0.3707, 'SWING', 'Joël Bruneau', [
      [2020, 'D', 'Joël Bruneau', 52.8, 39.7], [2014, 'D', 'Joël Bruneau', 50.1, 54.2], [2008, 'G', 'Philippe Duron', 53.4, 57.8]
    ]],
    ['14366', '14100', 'Lisieux', 49.1481, 0.2233, 'SWING', 'Sébastien Leclerc', [
      [2020, 'D', 'Sébastien Leclerc', 57.3, 37.8], [2014, 'D', 'Sébastien Leclerc', 54.2, 52.1], [2008, 'G', 'Bernard Aubril', 50.8, 56.4]
    ]],
    ['14047', '14400', 'Bayeux', 49.2764, -0.7028, 'STABLE', 'Patrick Gomont', [
      [2020, 'D', 'Patrick Gomont', 58.1, 41.5], [2014, 'D', 'Patrick Gomont', 55.7, 55.3], [2008, 'D', 'Patrick Gomont', 53.4, 58.7]
    ]],
  ]],
  ['15', 'Cantal', [
    ['15014', '15000', 'Aurillac', 44.9261, 2.4447, 'STABLE', 'Pierre Mathonier', [
      [2020, 'G', 'Pierre Mathonier', 54.7, 43.1], [2014, 'G', 'Pierre Mathonier', 52.3, 56.5], [2008, 'G', 'René Souchon', 55.8, 59.2]
    ]],
    ['15187', '15100', 'Saint-Flour', 45.0342, 3.0933, 'FORTRESS', 'Pierre Jarlier', [
      [2020, 'CD', 'Pierre Jarlier', 62.1, 44.8], [2014, 'CD', 'Pierre Jarlier', 65.3, 57.2], [2008, 'CD', 'Pierre Jarlier', 60.7, 60.1]
    ]],
    ['15122', '15200', 'Mauriac', 45.2192, 2.3317, 'STABLE', 'Edwige Gugg', [
      [2020, 'D', 'Edwige Gugg', 55.4, 45.2], [2014, 'D', 'Edwige Gugg', 53.8, 57.8], [2008, 'D', 'Michel Bos', 51.2, 60.5]
    ]],
  ]],
  ['16', 'Charente', [
    ['16015', '16000', 'Angoulême', 45.6500, 0.1556, 'STABLE', 'Xavier Bonnefont', [
      [2020, 'D', 'Xavier Bonnefont', 54.2, 38.5], [2014, 'D', 'Xavier Bonnefont', 51.8, 52.7], [2008, 'G', 'Philippe Lavaud', 50.3, 56.4]
    ]],
    ['16102', '16100', 'Cognac', 45.6958, -0.3292, 'STABLE', 'Michel Gourinchas', [
      [2020, 'G', 'Michel Gourinchas', 53.7, 39.8], [2014, 'G', 'Michel Gourinchas', 51.4, 53.2], [2008, 'G', 'Jérôme Mouhot', 55.1, 57.1]
    ]],
    ['16106', '16500', 'Confolens', 46.0131, 0.6717, 'STABLE', 'Emmanuel Bhrengarth', [
      [2020, 'D', 'Emmanuel Bhrengarth', 57.3, 42.1], [2014, 'D', 'Max Léonard', 54.8, 55.6], [2008, 'D', 'Max Léonard', 52.4, 58.8]
    ]],
  ]],
  ['17', 'Charente-Maritime', [
    ['17300', '17000', 'La Rochelle', 46.1603, -1.1511, 'FORTRESS', 'Jean-François Fountaine', [
      [2020, 'G', 'Jean-François Fountaine', 55.8, 40.2], [2014, 'G', 'Jean-François Fountaine', 53.4, 54.8], [2008, 'G', 'Maxime Bono', 58.1, 57.6]
    ]],
    ['17415', '17100', 'Saintes', 45.7461, -0.6331, 'SWING', 'Bruno Drapron', [
      [2020, 'D', 'Bruno Drapron', 52.1, 38.7], [2014, 'G', 'Jean-Philippe Machon', 50.8, 53.4], [2008, 'G', 'Jean-Philippe Machon', 54.2, 56.9]
    ]],
    ['17299', '17300', 'Rochefort', 45.9376, -0.9578, 'STABLE', 'Hervé Blanché', [
      [2020, 'D', 'Hervé Blanché', 54.3, 37.5], [2014, 'D', 'Hervé Blanché', 51.7, 52.1], [2008, 'G', 'Bernard Grasset', 50.4, 55.8]
    ]],
  ]],
  ['18', 'Cher', [
    ['18033', '18000', 'Bourges', 47.0810, 2.3986, 'SWING', 'Yann Galut', [
      [2020, 'G', 'Yann Galut', 50.8, 39.4], [2014, 'G', 'Pascal Blanc', 48.2, 53.1], [2008, 'D', 'Serge Lepeltier', 52.7, 56.8]
    ]],
    ['18279', '18100', 'Vierzon', 47.2222, 2.0694, 'FORTRESS', 'Nicolas Sansu', [
      [2020, 'EXG', 'Nicolas Sansu', 58.3, 37.8], [2014, 'EXG', 'Nicolas Sansu', 55.1, 51.4], [2008, 'EXG', 'Nicolas Sansu', 53.7, 55.2]
    ]],
    ['18197', '18200', 'Saint-Amand-Montrond', 46.7231, 2.5047, 'STABLE', 'Thierry Vinçon', [
      [2020, 'D', 'Thierry Vinçon', 56.4, 40.2], [2014, 'D', 'Thierry Vinçon', 54.1, 53.8], [2008, 'D', 'Thierry Vinçon', 52.8, 57.5]
    ]],
  ]],
  ['19', 'Corrèze', [
    ['19272', '19000', 'Tulle', 45.2681, 1.7694, 'FORTRESS', 'Bernard Combes', [
      [2020, 'G', 'Bernard Combes', 56.2, 42.3], [2014, 'G', 'Bernard Combes', 54.8, 55.7], [2008, 'G', 'François Hollande', 58.1, 58.4]
    ]],
    ['19031', '19100', 'Brive-la-Gaillarde', 45.1594, 1.5347, 'SWING', 'Frédéric Soulier', [
      [2020, 'D', 'Frédéric Soulier', 53.4, 40.8], [2014, 'D', 'Frédéric Soulier', 50.7, 54.2], [2008, 'G', 'Philippe Nauche', 52.3, 57.6]
    ]],
    ['19275', '19200', 'Ussel', 45.5486, 2.3108, 'STABLE', 'Christophe Arfeuillère', [
      [2020, 'D', 'Christophe Arfeuillère', 55.7, 43.1], [2014, 'D', 'Jean-Claude Peyramard', 53.2, 56.4], [2008, 'D', 'Jean-Claude Peyramard', 51.8, 59.2]
    ]],
  ]],
  ['2A', 'Corse-du-Sud', [
    ['2A004', '20000', 'Ajaccio', 41.9263, 8.7369, 'STABLE', 'Laurent Marcangeli', [
      [2020, 'D', 'Laurent Marcangeli', 55.3, 37.8], [2014, 'D', 'Laurent Marcangeli', 52.1, 51.4], [2008, 'G', 'Simon Renucci', 50.7, 54.8]
    ]],
    ['2A247', '20137', 'Porto-Vecchio', 41.5917, 9.2789, 'FORTRESS', 'Jean-Christophe Angelini', [
      [2020, 'DIV', 'Jean-Christophe Angelini', 54.8, 38.2], [2014, 'DIV', 'Georges Mela', 52.3, 50.7], [2008, 'DIV', 'Georges Mela', 56.1, 53.4]
    ]],
    ['2A272', '20100', 'Sartène', 41.6219, 8.9742, 'FORTRESS', 'Paul-Marie Bartoli', [
      [2020, 'DIV', 'Paul-Marie Bartoli', 58.2, 40.1], [2014, 'DIV', 'Paul-Marie Bartoli', 55.7, 52.8], [2008, 'DIV', 'Paul-Marie Bartoli', 53.4, 56.3]
    ]],
  ]],
  ['2B', 'Haute-Corse', [
    ['2B033', '20200', 'Bastia', 42.6972, 9.4506, 'SWING', 'Pierre Savelli', [
      [2020, 'DIV', 'Pierre Savelli', 51.7, 39.5], [2014, 'DIV', 'Pierre Savelli', 48.3, 52.1], [2008, 'G', 'Émile Zuccarelli', 53.8, 55.7]
    ]],
    ['2B096', '20250', 'Corte', 42.3058, 9.1486, 'FORTRESS', 'Xavier Ferracci', [
      [2020, 'DIV', 'Xavier Ferracci', 55.4, 41.2], [2014, 'DIV', 'Dominique Ferracci', 53.1, 53.8], [2008, 'DIV', 'Dominique Ferracci', 57.2, 56.4]
    ]],
    ['2B050', '20260', 'Calvi', 42.5681, 8.7575, 'STABLE', 'Ange Santini', [
      [2020, 'D', 'Ange Santini', 54.3, 38.7], [2014, 'D', 'Ange Santini', 56.8, 51.5], [2008, 'D', 'Ange Santini', 52.1, 54.9]
    ]],
  ]],
  ['21', 'Côte-d\'Or', [
    ['21231', '21000', 'Dijon', 47.3220, 5.0415, 'SWING', 'François Rebsamen', [
      [2020, 'G', 'François Rebsamen', 54.3, 41.2], [2014, 'G', 'François Rebsamen', 55.8, 55.4], [2008, 'G', 'François Rebsamen', 52.1, 58.7]
    ]],
    ['21054', '21200', 'Beaune', 47.0260, 4.8400, 'FORTRESS', 'Alain Suguenot', [
      [2020, 'D', 'Alain Suguenot', 58.7, 42.5], [2014, 'D', 'Alain Suguenot', 62.3, 55.1], [2008, 'D', 'Alain Suguenot', 56.4, 58.3]
    ]],
    ['21166', '21300', 'Chenôve', 47.2917, 5.0083, 'FORTRESS', 'Thierry Falconnet', [
      [2020, 'G', 'Thierry Falconnet', 56.8, 38.4], [2014, 'G', 'Thierry Falconnet', 58.2, 52.7], [2008, 'G', 'Roland Music', 54.1, 55.9]
    ]],
  ]],
  ['22', 'Côtes-d\'Armor', [
    ['22278', '22000', 'Saint-Brieuc', 48.5144, -2.7608, 'STABLE', 'Hervé Guihard', [
      [2020, 'G', 'Hervé Guihard', 52.4, 40.8], [2014, 'G', 'Bruno Joncour', 50.1, 54.3], [2008, 'G', 'Bruno Joncour', 53.7, 57.8]
    ]],
    ['22113', '22300', 'Lannion', 48.7322, -3.4556, 'FORTRESS', 'Paul Le Bihan', [
      [2020, 'G', 'Paul Le Bihan', 57.3, 42.1], [2014, 'G', 'Paul Le Bihan', 55.8, 55.7], [2008, 'G', 'Christian Marquet', 53.4, 58.4]
    ]],
    ['22050', '22100', 'Dinan', 48.4536, -2.0508, 'STABLE', 'Didier Lechien', [
      [2020, 'C', 'Didier Lechien', 54.1, 41.5], [2014, 'C', 'Didier Lechien', 52.8, 55.2], [2008, 'D', 'René Benoît', 50.3, 58.1]
    ]],
  ]],
  ['23', 'Creuse', [
    ['23096', '23000', 'Guéret', 46.1736, 1.8697, 'FORTRESS', 'Michel Vergnier', [
      [2020, 'G', 'Michel Vergnier', 58.4, 41.7], [2014, 'G', 'Michel Vergnier', 56.2, 54.8], [2008, 'G', 'Michel Vergnier', 60.1, 57.6]
    ]],
    ['23008', '23200', 'Aubusson', 45.9567, 2.1694, 'STABLE', 'Michel Moine', [
      [2020, 'G', 'Michel Moine', 54.7, 40.3], [2014, 'G', 'Michel Moine', 52.1, 53.5], [2008, 'G', 'Michel Moine', 55.8, 56.9]
    ]],
    ['23176', '23300', 'La Souterraine', 46.2381, 1.4875, 'STABLE', 'Patrick Durand', [
      [2020, 'G', 'Patrick Durand', 53.2, 42.8], [2014, 'G', 'Jean-Louis Jeannot', 51.7, 55.1], [2008, 'G', 'Jean-Louis Jeannot', 54.3, 58.4]
    ]],
  ]],
  ['24', 'Dordogne', [
    ['24322', '24000', 'Périgueux', 45.1847, 0.7211, 'SWING', 'Delphine Labails', [
      [2020, 'G', 'Delphine Labails', 50.8, 39.7], [2014, 'D', 'Antoine Audi', 52.3, 53.4], [2008, 'G', 'Michel Moyrand', 54.1, 57.2]
    ]],
    ['24037', '24100', 'Bergerac', 44.8533, 0.4825, 'SWING', 'Jonathan Prioleaud', [
      [2020, 'D', 'Jonathan Prioleaud', 51.4, 38.2], [2014, 'G', 'Daniel Garrigue', 49.8, 52.7], [2008, 'D', 'Daniel Garrigue', 53.5, 56.1]
    ]],
    ['24520', '24200', 'Sarlat-la-Canéda', 44.8898, 1.2161, 'STABLE', 'Jean-Jacques de Peretti', [
      [2020, 'D', 'Jean-Jacques de Peretti', 57.2, 41.5], [2014, 'D', 'Jean-Jacques de Peretti', 55.8, 54.8], [2008, 'D', 'Jean-Jacques de Peretti', 53.4, 58.3]
    ]],
  ]],
  ['25', 'Doubs', [
    ['25056', '25000', 'Besançon', 47.2378, 6.0241, 'STABLE', 'Anne Vignot', [
      [2020, 'EXG', 'Anne Vignot (EELV)', 53.7, 41.8], [2014, 'G', 'Jean-Louis Fousseret', 55.2, 55.3], [2008, 'G', 'Jean-Louis Fousseret', 52.4, 58.1]
    ]],
    ['25388', '25200', 'Montbéliard', 47.5103, 6.7983, 'STABLE', 'Marie-Noëlle Biguinet', [
      [2020, 'G', 'Marie-Noëlle Biguinet', 51.3, 38.5], [2014, 'G', 'Jacques Hélias', 50.8, 52.7], [2008, 'G', 'Jacques Hélias', 54.2, 56.4]
    ]],
    ['25462', '25300', 'Pontarlier', 46.9069, 6.3542, 'STABLE', 'Patrick Genre', [
      [2020, 'D', 'Patrick Genre', 56.8, 42.3], [2014, 'D', 'Patrick Genre', 54.1, 55.8], [2008, 'D', 'Patrick Genre', 52.7, 58.7]
    ]],
  ]],
  ['26', 'Drôme', [
    ['26362', '26000', 'Valence', 44.9333, 4.8917, 'SWING', 'Nicolas Daragon', [
      [2020, 'D', 'Nicolas Daragon', 55.2, 39.4], [2014, 'D', 'Nicolas Daragon', 52.8, 53.7], [2008, 'G', 'Alain Maurice', 50.1, 57.2]
    ]],
    ['26198', '26200', 'Montélimar', 44.5583, 4.7500, 'SWING', 'Julien Cornillet', [
      [2020, 'D', 'Julien Cornillet', 52.3, 37.8], [2014, 'G', 'Franck Reynier', 48.7, 52.1], [2008, 'G', 'Franck Reynier', 51.4, 55.8]
    ]],
    ['26281', '26100', 'Romans-sur-Isère', 45.0439, 5.0508, 'SWING', 'Marie-Hélène Thoraval', [
      [2020, 'D', 'Marie-Hélène Thoraval', 50.8, 38.2], [2014, 'G', 'Marie-Hélène Thoraval', 47.3, 51.4], [2008, 'G', 'Henri Pleynet', 53.2, 56.1]
    ]],
  ]],
  ['27', 'Eure', [
    ['27229', '27000', 'Évreux', 49.0242, 1.1508, 'SWING', 'Guy Lefrand', [
      [2020, 'D', 'Guy Lefrand', 54.7, 37.5], [2014, 'D', 'Guy Lefrand', 52.3, 51.8], [2008, 'G', 'Michel Champredon', 50.8, 55.4]
    ]],
    ['27681', '27200', 'Vernon', 49.0928, 1.4867, 'SWING', 'François Ouzilleau', [
      [2020, 'D', 'François Ouzilleau', 53.1, 36.8], [2014, 'G', 'François Ouzilleau', 48.7, 50.4], [2008, 'G', 'Antoine Hénault', 52.4, 54.7]
    ]],
    ['27375', '27400', 'Louviers', 49.2153, 1.1697, 'STABLE', 'François-Xavier Priollaud', [
      [2020, 'D', 'François-Xavier Priollaud', 55.8, 38.3], [2014, 'D', 'Franck Martin', 51.2, 52.7], [2008, 'G', 'Franck Martin', 48.4, 56.1]
    ]],
  ]],
  ['28', 'Eure-et-Loir', [
    ['28085', '28000', 'Chartres', 48.4564, 1.4839, 'FORTRESS', 'Jean-Pierre Gorges', [
      [2020, 'D', 'Jean-Pierre Gorges', 62.4, 38.7], [2014, 'D', 'Jean-Pierre Gorges', 64.8, 53.2], [2008, 'D', 'Jean-Pierre Gorges', 58.3, 56.8]
    ]],
    ['28134', '28100', 'Dreux', 48.7364, 1.3667, 'SWING', 'Pierre-Frédéric Billet', [
      [2020, 'D', 'Pierre-Frédéric Billet', 53.2, 35.4], [2014, 'D', 'Gérard Hamel', 55.7, 49.8], [2008, 'G', 'Gérard Hamel', 46.3, 54.2]
    ]],
    ['28088', '28200', 'Châteaudun', 48.0706, 1.3381, 'STABLE', 'Fabien Music', [
      [2020, 'D', 'Fabien Music', 54.8, 39.1], [2014, 'D', 'Edmond Hervé', 52.3, 52.8], [2008, 'D', 'Jean-Pierre Millereau', 50.7, 56.4]
    ]],
  ]],
  ['29', 'Finistère', [
    ['29019', '29200', 'Brest', 48.3904, -4.4861, 'FORTRESS', 'François Cuillandre', [
      [2020, 'G', 'François Cuillandre', 58.3, 40.5], [2014, 'G', 'François Cuillandre', 55.7, 54.8], [2008, 'G', 'François Cuillandre', 57.2, 57.6]
    ]],
    ['29232', '29000', 'Quimper', 47.9961, -4.1028, 'SWING', 'Isabelle Assih', [
      [2020, 'G', 'Isabelle Assih', 50.4, 39.2], [2014, 'D', 'Ludovic Jolivet', 52.8, 53.7], [2008, 'G', 'Bernard Poignant', 54.1, 56.8]
    ]],
    ['29151', '29600', 'Morlaix', 48.5775, -3.8283, 'FORTRESS', 'Jean-Paul Vermot', [
      [2020, 'EXG', 'Jean-Paul Vermot', 54.7, 41.3], [2014, 'G', 'Agnès Le Brun', 48.2, 54.5], [2008, 'G', 'Marylise Lebranchu', 56.8, 57.4]
    ]],
  ]],
  ['30', 'Gard', [
    ['30189', '30000', 'Nîmes', 43.8367, 4.3601, 'SWING', 'Jean-Paul Fournier', [
      [2020, 'D', 'Jean-Paul Fournier', 54.3, 38.4], [2014, 'D', 'Jean-Paul Fournier', 55.8, 52.1], [2008, 'D', 'Jean-Paul Fournier', 52.7, 55.7]
    ]],
    ['30007', '30100', 'Alès', 44.1244, 4.0817, 'SWING', 'Christophe Rivenq', [
      [2020, 'D', 'Christophe Rivenq', 51.2, 37.5], [2014, 'G', 'Max Roustan', 49.8, 51.4], [2008, 'D', 'Max Roustan', 53.4, 55.2]
    ]],
    ['30032', '30300', 'Beaucaire', 43.8064, 4.6447, 'FORTRESS', 'Julien Sanchez', [
      [2020, 'EXD', 'Julien Sanchez (RN)', 61.3, 39.7], [2014, 'EXD', 'Julien Sanchez (FN)', 52.8, 54.2], [2008, 'D', 'Jacques Bourbousson', 54.1, 57.8]
    ]],
  ]],
  ['31', 'Haute-Garonne', [
    ['31555', '31000', 'Toulouse', 43.6047, 1.4442, 'STABLE', 'Jean-Luc Moudenc', [
      [2020, 'D', 'Jean-Luc Moudenc', 51.8, 38.2], [2014, 'D', 'Jean-Luc Moudenc', 52.4, 53.7], [2008, 'G', 'Pierre Cohen', 50.1, 56.8]
    ]],
    ['31395', '31600', 'Muret', 43.4614, 1.3261, 'STABLE', 'André Mandement', [
      [2020, 'G', 'André Mandement', 53.4, 39.5], [2014, 'G', 'André Mandement', 51.8, 52.4], [2008, 'G', 'André Mandement', 55.7, 56.1]
    ]],
    ['31149', '31770', 'Colomiers', 43.6117, 1.3367, 'FORTRESS', 'Karine Traval-Michelet', [
      [2020, 'G', 'Karine Traval-Michelet', 57.2, 40.8], [2014, 'G', 'Karine Traval-Michelet', 55.4, 54.1], [2008, 'G', 'Bernard Sicard', 58.3, 57.5]
    ]],
  ]],
  ['32', 'Gers', [
    ['32013', '32000', 'Auch', 43.6467, 0.5853, 'FORTRESS', 'Christian Lapalu', [
      [2020, 'G', 'Christian Lapalu', 54.8, 42.3], [2014, 'G', 'Christian Lapalu', 52.7, 55.8], [2008, 'G', 'Franck Montaugé', 56.1, 58.4]
    ]],
    ['32107', '32100', 'Condom', 43.9581, 0.3725, 'STABLE', 'Gérard Duclos', [
      [2020, 'G', 'Gérard Duclos', 53.2, 41.7], [2014, 'G', 'Gérard Duclos', 51.8, 54.3], [2008, 'G', 'Gérard Duclos', 55.4, 57.2]
    ]],
    ['32208', '32700', 'Lectoure', 43.9347, 0.6225, 'FORTRESS', 'Gérard Guilhempey', [
      [2020, 'G', 'Gérard Guilhempey', 57.3, 43.5], [2014, 'G', 'Gérard Guilhempey', 55.1, 56.2], [2008, 'G', 'Gérard Guilhempey', 53.8, 59.1]
    ]],
  ]],
  // Gironde: already have Bordeaux, add 2 more
  ['33', 'Gironde', [
    ['33281', '33700', 'Mérignac', 44.8386, -0.6436, 'STABLE', 'Alain Anziani', [
      [2020, 'G', 'Alain Anziani', 55.4, 39.8], [2014, 'G', 'Alain Anziani', 53.7, 53.2], [2008, 'G', 'Michel Sainte-Marie', 57.1, 56.8]
    ]],
    ['33318', '33600', 'Pessac', 44.8067, -0.6311, 'STABLE', 'Franck Raynal', [
      [2020, 'G', 'Franck Raynal', 52.8, 38.4], [2014, 'G', 'Jean-Jacques Benoit', 50.3, 52.7], [2008, 'G', 'Jean-Jacques Benoit', 54.6, 55.9]
    ]],
  ]],
  ['34', 'Hérault', [
    ['34172', '34000', 'Montpellier', 43.6108, 3.8767, 'SWING', 'Michaël Delafosse', [
      [2020, 'G', 'Michaël Delafosse', 54.2, 39.1], [2014, 'D', 'Philippe Saurel', 51.8, 52.4], [2008, 'G', 'Hélène Mandroux', 53.7, 56.8]
    ]],
    ['34032', '34500', 'Béziers', 43.3440, 3.2192, 'FORTRESS', 'Robert Ménard', [
      [2020, 'EXD', 'Robert Ménard', 68.7, 40.3], [2014, 'EXD', 'Robert Ménard', 46.9, 55.8], [2008, 'G', 'Raymond Couderc', 44.2, 58.4]
    ]],
    ['34301', '34200', 'Sète', 43.4053, 3.6975, 'SWING', 'François Commeinhes', [
      [2020, 'D', 'François Commeinhes', 52.1, 37.8], [2014, 'D', 'François Commeinhes', 50.4, 51.7], [2008, 'G', 'François Liberti', 48.3, 55.4]
    ]],
  ]],
  ['35', 'Ille-et-Vilaine', [
    ['35238', '35000', 'Rennes', 48.1173, -1.6778, 'FORTRESS', 'Nathalie Appéré', [
      [2020, 'G', 'Nathalie Appéré', 63.7, 41.2], [2014, 'G', 'Nathalie Appéré', 55.8, 54.7], [2008, 'G', 'Daniel Delaveau', 57.3, 57.4]
    ]],
    ['35288', '35400', 'Saint-Malo', 48.6492, -2.0069, 'SWING', 'Gilles Lurton', [
      [2020, 'D', 'Gilles Lurton', 53.4, 40.5], [2014, 'D', 'Claude Renoult', 51.2, 53.8], [2008, 'G', 'René Couanau', 48.7, 57.1]
    ]],
    ['35360', '35500', 'Vitré', 48.1206, -1.2103, 'FORTRESS', 'Pierre Méhaignerie', [
      [2020, 'CD', 'Pierre Méhaignerie', 62.8, 43.7], [2014, 'CD', 'Pierre Méhaignerie', 65.4, 56.2], [2008, 'CD', 'Pierre Méhaignerie', 60.1, 59.8]
    ]],
  ]],
  ['36', 'Indre', [
    ['36044', '36000', 'Châteauroux', 46.8103, 1.6911, 'SWING', 'Gil Avérous', [
      [2020, 'D', 'Gil Avérous', 55.3, 38.7], [2014, 'D', 'Gil Avérous', 52.8, 52.4], [2008, 'G', 'Jean-François Mayet', 50.1, 56.1]
    ]],
    ['36088', '36100', 'Issoudun', 46.9478, 1.9933, 'STABLE', 'André Laignel', [
      [2020, 'G', 'André Laignel', 56.7, 40.2], [2014, 'G', 'André Laignel', 58.3, 53.8], [2008, 'G', 'André Laignel', 60.1, 57.4]
    ]],
    ['36018', '36300', 'Le Blanc', 46.6333, 1.0667, 'STABLE', 'Michel Mauny', [
      [2020, 'D', 'Michel Mauny', 53.4, 41.3], [2014, 'D', 'Michel Mauny', 51.8, 54.7], [2008, 'D', 'Michel Mauny', 55.2, 58.2]
    ]],
  ]],
  ['37', 'Indre-et-Loire', [
    ['37261', '37000', 'Tours', 47.3941, 0.6848, 'SWING', 'Emmanuel Denis', [
      [2020, 'EXG', 'Emmanuel Denis (EELV)', 52.4, 40.8], [2014, 'G', 'Serge Babary', 48.2, 54.3], [2008, 'G', 'Jean Germain', 55.7, 57.6]
    ]],
    ['37003', '37400', 'Amboise', 47.4133, 0.9817, 'FORTRESS', 'Thierry Boutard', [
      [2020, 'D', 'Thierry Boutard', 55.8, 42.7], [2014, 'D', 'Christian Guyon', 57.3, 55.4], [2008, 'D', 'Christian Guyon', 53.1, 58.8]
    ]],
    ['37072', '37500', 'Chinon', 47.1667, 0.2333, 'STABLE', 'Jean-Luc Dupont', [
      [2020, 'D', 'Jean-Luc Dupont', 54.3, 41.5], [2014, 'D', 'Jean-Luc Dupont', 52.8, 54.1], [2008, 'D', 'Yves Dauge', 49.7, 57.3]
    ]],
  ]],
  ['38', 'Isère', [
    ['38185', '38000', 'Grenoble', 45.1885, 5.7245, 'STABLE', 'Éric Piolle', [
      [2020, 'EXG', 'Éric Piolle (EELV)', 53.1, 40.7], [2014, 'EXG', 'Éric Piolle (EELV)', 50.3, 55.2], [2008, 'G', 'Michel Destot', 54.8, 57.9]
    ]],
    ['38544', '38200', 'Vienne', 45.5236, 4.8783, 'STABLE', 'Thierry Kovacs', [
      [2020, 'D', 'Thierry Kovacs', 56.4, 39.3], [2014, 'D', 'Thierry Kovacs', 53.7, 53.8], [2008, 'D', 'Jacques Remiller', 51.2, 57.1]
    ]],
    ['38053', '38300', 'Bourgoin-Jallieu', 45.5856, 5.2739, 'SWING', 'Vincent Chriqui', [
      [2020, 'D', 'Vincent Chriqui', 52.7, 38.5], [2014, 'G', 'Alain Cottalorda', 50.1, 52.4], [2008, 'G', 'Alain Cottalorda', 53.4, 56.7]
    ]],
  ]],
  ['39', 'Jura', [
    ['39300', '39000', 'Lons-le-Saunier', 46.6753, 5.5547, 'SWING', 'Jacques Pélissard', [
      [2020, 'D', 'Jacques Pélissard', 58.4, 40.2], [2014, 'D', 'Jacques Pélissard', 61.2, 54.8], [2008, 'D', 'Jacques Pélissard', 56.3, 57.4]
    ]],
    ['39198', '39100', 'Dole', 47.0953, 5.4903, 'SWING', 'Jean-Marie Sermier', [
      [2020, 'D', 'Jean-Marie Sermier', 55.7, 39.8], [2014, 'D', 'Jean-Marie Sermier', 52.1, 53.2], [2008, 'G', 'Jean-Claude Wambst', 50.4, 56.8]
    ]],
    ['39478', '39200', 'Saint-Claude', 46.3878, 5.8656, 'STABLE', 'Jean-Louis Millet', [
      [2020, 'G', 'Jean-Louis Millet', 52.3, 38.4], [2014, 'G', 'Jean-Louis Millet', 50.8, 52.1], [2008, 'G', 'Jean-Louis Millet', 54.7, 55.7]
    ]],
  ]],
  ['40', 'Landes', [
    ['40192', '40000', 'Mont-de-Marsan', 43.8914, -0.4972, 'SWING', 'Charles Dayot', [
      [2020, 'D', 'Charles Dayot', 52.4, 39.5], [2014, 'D', 'Geneviève Darrieussecq', 54.8, 53.1], [2008, 'G', 'Geneviève Darrieussecq', 48.2, 56.7]
    ]],
    ['40088', '40100', 'Dax', 43.7103, -1.0536, 'STABLE', 'Julien Dubois', [
      [2020, 'G', 'Julien Dubois', 53.7, 38.8], [2014, 'G', 'Gabriel Bellocq', 51.2, 52.4], [2008, 'G', 'Gabriel Bellocq', 55.4, 56.1]
    ]],
    ['40046', '40600', 'Biscarrosse', 44.3942, -1.1672, 'STABLE', 'Alain Dudon', [
      [2020, 'D', 'Alain Dudon', 57.1, 41.2], [2014, 'D', 'Alain Dudon', 55.3, 54.7], [2008, 'D', 'Alain Dudon', 52.8, 57.9]
    ]],
  ]],
  ['41', 'Loir-et-Cher', [
    ['41018', '41000', 'Blois', 47.5861, 1.3311, 'SWING', 'Marc Gricourt', [
      [2020, 'G', 'Marc Gricourt', 51.4, 39.2], [2014, 'G', 'Marc Gricourt', 50.8, 53.5], [2008, 'D', 'Nicolas Perruchot', 52.3, 57.1]
    ]],
    ['41269', '41100', 'Vendôme', 47.7931, 1.0667, 'STABLE', 'Laurent Brillard', [
      [2020, 'D', 'Laurent Brillard', 54.8, 40.7], [2014, 'D', 'Laurent Brillard', 52.3, 54.2], [2008, 'G', 'Patrice Martin-Lalande', 49.1, 57.8]
    ]],
    ['41194', '41200', 'Romorantin-Lanthenay', 47.3567, 1.7464, 'STABLE', 'Jeanny Lorgeoux', [
      [2020, 'G', 'Jeanny Lorgeoux', 53.2, 38.5], [2014, 'G', 'Jeanny Lorgeoux', 51.7, 52.8], [2008, 'G', 'Jeanny Lorgeoux', 55.4, 56.4]
    ]],
  ]],
  ['42', 'Loire', [
    ['42218', '42000', 'Saint-Étienne', 45.4397, 4.3872, 'SWING', 'Gaël Perdriau', [
      [2020, 'D', 'Gaël Perdriau', 52.7, 37.4], [2014, 'D', 'Gaël Perdriau', 50.3, 52.1], [2008, 'G', 'Maurice Vincent', 53.8, 56.5]
    ]],
    ['42187', '42300', 'Roanne', 46.0367, 4.0689, 'STABLE', 'Yves Nicolin', [
      [2020, 'D', 'Yves Nicolin', 58.4, 39.8], [2014, 'D', 'Yves Nicolin', 56.1, 53.4], [2008, 'D', 'Laure Déroche', 52.7, 57.2]
    ]],
    ['42147', '42600', 'Montbrison', 45.6072, 4.0644, 'FORTRESS', 'Luc Réallon', [
      [2020, 'D', 'Luc Réallon', 59.3, 42.1], [2014, 'D', 'Daniel Vachez', 57.8, 55.7], [2008, 'D', 'Daniel Vachez', 54.2, 58.4]
    ]],
  ]],
  ['43', 'Haute-Loire', [
    ['43157', '43000', 'Le Puy-en-Velay', 45.0444, 3.8847, 'STABLE', 'Michel Chapuis', [
      [2020, 'D', 'Michel Chapuis', 56.8, 41.3], [2014, 'D', 'Laurent Wauquiez', 62.4, 55.8], [2008, 'D', 'Laurent Wauquiez', 58.1, 58.2]
    ]],
    ['43040', '43100', 'Brioude', 45.2944, 3.3836, 'STABLE', 'Jean-Michel Lacroix', [
      [2020, 'D', 'Jean-Michel Lacroix', 54.3, 42.7], [2014, 'D', 'Jean-Michel Lacroix', 52.8, 55.4], [2008, 'D', 'Laurent Music', 50.1, 58.7]
    ]],
    ['43262', '43200', 'Yssingeaux', 45.1428, 4.1239, 'FORTRESS', 'André Merle', [
      [2020, 'D', 'André Merle', 61.2, 44.5], [2014, 'D', 'André Merle', 63.7, 57.1], [2008, 'D', 'André Merle', 59.4, 60.3]
    ]],
  ]],
  ['44', 'Loire-Atlantique', [
    ['44109', '44000', 'Nantes', 47.2184, -1.5536, 'STABLE', 'Johanna Rolland', [
      [2020, 'G', 'Johanna Rolland', 59.4, 41.8], [2014, 'G', 'Johanna Rolland', 56.2, 55.3], [2008, 'G', 'Jean-Marc Ayrault', 58.7, 57.4]
    ]],
    ['44184', '44600', 'Saint-Nazaire', 47.2736, -2.2136, 'FORTRESS', 'David Samzun', [
      [2020, 'G', 'David Samzun', 55.1, 39.7], [2014, 'G', 'David Samzun', 53.8, 53.2], [2008, 'G', 'Joël Batteux', 57.4, 56.8]
    ]],
    ['44143', '44400', 'Rezé', 47.1847, -1.5647, 'FORTRESS', 'Martial Music', [
      [2020, 'G', 'Martial Music', 57.8, 42.3], [2014, 'G', 'Gérard Allard', 55.4, 54.7], [2008, 'G', 'Gérard Allard', 59.1, 57.2]
    ]],
  ]],
  ['45', 'Loiret', [
    ['45234', '45000', 'Orléans', 47.9029, 1.9039, 'SWING', 'Serge Grouard', [
      [2020, 'D', 'Serge Grouard', 54.8, 39.4], [2014, 'D', 'Serge Grouard', 56.3, 53.8], [2008, 'D', 'Serge Grouard', 52.1, 57.2]
    ]],
    ['45208', '45200', 'Montargis', 47.9978, 2.7333, 'SWING', 'Benoît Digeon', [
      [2020, 'D', 'Benoît Digeon', 53.2, 37.8], [2014, 'D', 'Benoît Digeon', 51.7, 52.4], [2008, 'G', 'Jean-Pierre Door', 48.4, 56.1]
    ]],
    ['45252', '45300', 'Pithiviers', 48.1719, 2.2522, 'STABLE', 'Philippe Nolland', [
      [2020, 'D', 'Philippe Nolland', 55.4, 38.5], [2014, 'D', 'Philippe Nolland', 53.8, 51.7], [2008, 'D', 'Marie-Josée Danon', 50.2, 55.8]
    ]],
  ]],
  ['46', 'Lot', [
    ['46042', '46000', 'Cahors', 44.4475, 1.4400, 'STABLE', 'Jean-Marc Vayssouze-Faure', [
      [2020, 'G', 'Jean-Marc Vayssouze-Faure', 55.3, 41.2], [2014, 'G', 'Jean-Marc Vayssouze-Faure', 53.8, 54.7], [2008, 'G', 'Jean-Marc Vayssouze-Faure', 57.2, 57.8]
    ]],
    ['46102', '46100', 'Figeac', 44.6086, 2.0322, 'FORTRESS', 'André Mellinger', [
      [2020, 'G', 'André Mellinger', 56.7, 42.8], [2014, 'G', 'Martin Malvy', 58.3, 55.4], [2008, 'G', 'Martin Malvy', 60.1, 58.7]
    ]],
    ['46127', '46300', 'Gourdon', 44.7358, 1.3833, 'STABLE', 'Bruno Music', [
      [2020, 'D', 'Bruno Music', 54.2, 43.5], [2014, 'D', 'Bruno Music', 52.8, 56.1], [2008, 'D', 'Bruno Music', 50.7, 59.3]
    ]],
  ]],
  ['47', 'Lot-et-Garonne', [
    ['47001', '47000', 'Agen', 44.2033, 0.6167, 'SWING', 'Jean Dionis du Séjour', [
      [2020, 'C', 'Jean Dionis du Séjour', 52.8, 39.7], [2014, 'C', 'Jean Dionis du Séjour', 54.3, 53.4], [2008, 'G', 'Albert Rouquié', 50.1, 56.8]
    ]],
    ['47323', '47300', 'Villeneuve-sur-Lot', 44.4086, 0.7050, 'SWING', 'Guillaume Lepers', [
      [2020, 'D', 'Guillaume Lepers', 51.4, 38.2], [2014, 'G', 'Jérôme Cahuzac', 48.7, 52.1], [2008, 'G', 'Jérôme Cahuzac', 53.5, 55.7]
    ]],
    ['47159', '47200', 'Marmande', 44.5003, 0.1647, 'STABLE', 'Daniel Benquet', [
      [2020, 'G', 'Daniel Benquet', 54.1, 40.5], [2014, 'G', 'Daniel Benquet', 52.7, 53.8], [2008, 'G', 'Daniel Benquet', 56.3, 57.1]
    ]],
  ]],
  ['48', 'Lozère', [
    ['48095', '48000', 'Mende', 44.5189, 3.4994, 'FORTRESS', 'Laurent Suau', [
      [2020, 'D', 'Laurent Suau', 58.4, 43.2], [2014, 'D', 'Laurent Suau', 56.7, 56.8], [2008, 'D', 'Jean-Jacques Delmas', 54.3, 59.4]
    ]],
    ['48061', '48400', 'Florac', 44.3247, 3.5936, 'STABLE', 'Jean-Marie Soulier', [
      [2020, 'D', 'Jean-Marie Soulier', 55.1, 44.7], [2014, 'D', 'Jean-Marie Soulier', 53.8, 57.4], [2008, 'D', 'Michel Vernède', 51.2, 60.1]
    ]],
    ['48092', '48100', 'Marvejols', 44.5506, 3.2903, 'STABLE', 'Alain Argilier', [
      [2020, 'D', 'Alain Argilier', 56.7, 42.5], [2014, 'D', 'Alain Argilier', 54.3, 55.8], [2008, 'G', 'Pierre Music', 49.8, 58.7]
    ]],
  ]],
  ['49', 'Maine-et-Loire', [
    ['49007', '49000', 'Angers', 47.4784, -0.5632, 'SWING', 'Christophe Béchu', [
      [2020, 'D', 'Christophe Béchu', 54.2, 40.3], [2014, 'D', 'Christophe Béchu', 52.8, 54.7], [2008, 'G', 'Jean-Claude Antonini', 50.1, 57.8]
    ]],
    ['49099', '49300', 'Cholet', 47.0597, -0.8792, 'FORTRESS', 'Gilles Bourdouleix', [
      [2020, 'D', 'Gilles Bourdouleix', 62.8, 41.5], [2014, 'D', 'Gilles Bourdouleix', 64.3, 55.2], [2008, 'D', 'Gilles Bourdouleix', 60.7, 58.8]
    ]],
    ['49328', '49400', 'Saumur', 47.2597, -0.0761, 'SWING', 'Jackie Goulet', [
      [2020, 'D', 'Jackie Goulet', 53.4, 39.7], [2014, 'D', 'Jean-Michel Marchand', 51.8, 53.4], [2008, 'G', 'Jean-Michel Marchand', 48.2, 56.7]
    ]],
  ]],
  ['50', 'Manche', [
    ['50502', '50000', 'Saint-Lô', 49.1164, -1.0906, 'SWING', 'François Brière', [
      [2020, 'D', 'François Brière', 54.7, 39.2], [2014, 'D', 'François Brière', 52.3, 53.8], [2008, 'G', 'Jean-Karl Deschamps', 50.8, 57.4]
    ]],
    ['50129', '50100', 'Cherbourg-en-Cotentin', 49.6337, -1.6222, 'STABLE', 'Benoît Arrivé', [
      [2020, 'G', 'Benoît Arrivé', 55.3, 38.7], [2014, 'G', 'Jean-Michel Houllegatte', 53.1, 52.4], [2008, 'G', 'Bernard Cazeneuve', 57.8, 56.1]
    ]],
    ['50218', '50400', 'Granville', 48.8378, -1.5969, 'STABLE', 'Gilles Ménard', [
      [2020, 'D', 'Gilles Ménard', 56.4, 40.5], [2014, 'D', 'Claude Houbron', 54.8, 54.2], [2008, 'D', 'Claude Houbron', 52.1, 57.8]
    ]],
  ]],
  ['51', 'Marne', [
    ['51454', '51100', 'Reims', 49.2583, 4.0317, 'SWING', 'Arnaud Robinet', [
      [2020, 'D', 'Arnaud Robinet', 55.8, 38.4], [2014, 'D', 'Arnaud Robinet', 53.2, 52.7], [2008, 'G', 'Adeline Hazan', 50.4, 56.3]
    ]],
    ['51108', '51000', 'Châlons-en-Champagne', 48.9578, 4.3631, 'SWING', 'Benoît Apparu', [
      [2020, 'D', 'Benoît Apparu', 54.3, 37.8], [2014, 'D', 'Benoît Apparu', 52.7, 51.4], [2008, 'G', 'Bruno Bourg-Broc', 48.2, 55.1]
    ]],
    ['51230', '51200', 'Épernay', 49.0400, 3.9500, 'STABLE', 'Franck Leroy', [
      [2020, 'D', 'Franck Leroy', 57.4, 39.5], [2014, 'D', 'Franck Leroy', 55.8, 53.2], [2008, 'D', 'Franck Leroy', 53.1, 56.8]
    ]],
  ]],
  ['52', 'Haute-Marne', [
    ['52121', '52000', 'Chaumont', 48.1136, 5.1392, 'SWING', 'Luc Chatel', [
      [2020, 'D', 'Luc Chatel', 56.7, 38.1], [2014, 'D', 'Luc Chatel', 54.3, 51.8], [2008, 'G', 'Luc Chatel', 47.2, 55.4]
    ]],
    ['52269', '52200', 'Langres', 47.8614, 5.3339, 'STABLE', 'Didier Frérot', [
      [2020, 'D', 'Didier Frérot', 55.8, 39.7], [2014, 'D', 'Didier Frérot', 53.4, 53.1], [2008, 'D', 'Michel Thomann', 51.2, 56.8]
    ]],
    ['52448', '52100', 'Saint-Dizier', 48.6381, 4.9494, 'SWING', 'Quentin Brière', [
      [2020, 'D', 'Quentin Brière', 52.4, 36.5], [2014, 'G', 'François Cornut-Gentille', 49.8, 50.7], [2008, 'G', 'François Cornut-Gentille', 53.1, 54.8]
    ]],
  ]],
  ['53', 'Mayenne', [
    ['53130', '53000', 'Laval', 48.0697, -0.7722, 'SWING', 'Florian Bercault', [
      [2020, 'C', 'Florian Bercault', 52.8, 39.4], [2014, 'D', 'François Zocchetto', 54.3, 53.7], [2008, 'D', 'Guillaume Garot', 48.7, 57.1]
    ]],
    ['53062', '53200', 'Château-Gontier', 47.8278, -0.7025, 'FORTRESS', 'Daniel Lenoir', [
      [2020, 'D', 'Daniel Lenoir', 58.4, 41.2], [2014, 'D', 'Daniel Lenoir', 61.7, 54.8], [2008, 'D', 'Daniel Lenoir', 56.3, 58.4]
    ]],
    ['53147', '53100', 'Mayenne', 48.3025, -0.6147, 'STABLE', 'Michel Angot', [
      [2020, 'D', 'Michel Angot', 55.1, 40.8], [2014, 'D', 'Michel Angot', 53.7, 54.2], [2008, 'D', 'Jean-Michel Boyer', 51.4, 57.6]
    ]],
  ]],
  ['54', 'Meurthe-et-Moselle', [
    ['54395', '54000', 'Nancy', 48.6921, 6.1844, 'SWING', 'Mathieu Klein', [
      [2020, 'G', 'Mathieu Klein', 52.4, 40.1], [2014, 'D', 'Laurent Hénart', 51.8, 54.3], [2008, 'D', 'André Rossinot', 55.7, 57.8]
    ]],
    ['54304', '54300', 'Lunéville', 48.5933, 6.5014, 'SWING', 'Jacques Lamblin', [
      [2020, 'D', 'Jacques Lamblin', 53.7, 37.5], [2014, 'D', 'Jacques Lamblin', 51.2, 51.8], [2008, 'G', 'Alix Nyssen', 49.8, 55.4]
    ]],
    ['54528', '54200', 'Toul', 48.6753, 5.8919, 'STABLE', 'Aldo Music', [
      [2020, 'D', 'Aldo Music', 54.8, 38.7], [2014, 'D', 'Aldo Music', 52.3, 52.4], [2008, 'G', 'Aldo Music', 48.1, 56.2]
    ]],
  ]],
  ['55', 'Meuse', [
    ['55029', '55000', 'Bar-le-Duc', 48.7733, 5.1589, 'SWING', 'Bertrand Pancher', [
      [2020, 'D', 'Bertrand Pancher', 55.4, 38.2], [2014, 'D', 'Bertrand Pancher', 53.1, 52.7], [2008, 'G', 'Nelly Léger', 50.8, 56.4]
    ]],
    ['55545', '55100', 'Verdun', 49.1600, 5.3833, 'SWING', 'Samuel Hazard', [
      [2020, 'D', 'Samuel Hazard', 52.7, 36.8], [2014, 'G', 'Samuel Hazard', 49.3, 51.2], [2008, 'G', 'Arsène Lux', 53.4, 55.7]
    ]],
    ['55122', '55200', 'Commercy', 48.7614, 5.5919, 'STABLE', 'Denis Music', [
      [2020, 'D', 'Denis Music', 56.1, 39.4], [2014, 'D', 'Jérôme Dumont', 54.7, 53.8], [2008, 'D', 'Jérôme Dumont', 52.3, 57.1]
    ]],
  ]],
  ['56', 'Morbihan', [
    ['56260', '56000', 'Vannes', 47.6558, -2.7600, 'SWING', 'David Robo', [
      [2020, 'D', 'David Robo', 55.3, 40.8], [2014, 'D', 'David Robo', 53.7, 54.2], [2008, 'G', 'François Goulard', 48.4, 57.6]
    ]],
    ['56121', '56100', 'Lorient', 47.7483, -3.3700, 'STABLE', 'Fabrice Loher', [
      [2020, 'G', 'Fabrice Loher', 54.8, 39.5], [2014, 'G', 'Norbert Métairie', 52.3, 53.8], [2008, 'G', 'Norbert Métairie', 56.1, 56.4]
    ]],
    ['56178', '56300', 'Pontivy', 48.0678, -2.9633, 'FORTRESS', 'Christine Le Strat', [
      [2020, 'D', 'Christine Le Strat', 57.4, 41.3], [2014, 'D', 'Christine Le Strat', 55.8, 54.7], [2008, 'D', 'Christine Le Strat', 53.2, 57.8]
    ]],
  ]],
  ['57', 'Moselle', [
    ['57463', '57000', 'Metz', 49.1193, 6.1757, 'SWING', 'François Grosdidier', [
      [2020, 'D', 'François Grosdidier', 53.4, 39.2], [2014, 'G', 'Dominique Gros', 50.8, 53.7], [2008, 'G', 'Dominique Gros', 54.1, 56.8]
    ]],
    ['57672', '57100', 'Thionville', 49.3578, 6.1681, 'STABLE', 'Pierre Cuny', [
      [2020, 'D', 'Pierre Cuny', 56.7, 38.4], [2014, 'D', 'Anne Grommerch', 54.3, 52.1], [2008, 'D', 'Jean-Marie Demange', 52.8, 55.7]
    ]],
    ['57227', '57600', 'Forbach', 49.1847, 6.9006, 'SWING', 'Alexandre Cassaro', [
      [2020, 'D', 'Alexandre Cassaro', 51.2, 36.7], [2014, 'G', 'Laurent Kalinowski', 49.8, 50.4], [2008, 'G', 'Laurent Kalinowski', 53.4, 54.8]
    ]],
  ]],
  ['58', 'Nièvre', [
    ['58194', '58000', 'Nevers', 46.9903, 3.1592, 'STABLE', 'Denis Thuriot', [
      [2020, 'C', 'Denis Thuriot', 54.3, 39.8], [2014, 'G', 'Denis Thuriot', 48.2, 53.4], [2008, 'G', 'Didier Boulaud', 55.7, 57.1]
    ]],
    ['58086', '58200', 'Cosne-Cours-sur-Loire', 47.4108, 2.9244, 'STABLE', 'Fabien Bazin', [
      [2020, 'G', 'Fabien Bazin', 53.7, 40.2], [2014, 'G', 'André Villiers', 51.4, 53.8], [2008, 'G', 'André Villiers', 55.2, 56.7]
    ]],
    ['58079', '58500', 'Clamecy', 47.4600, 3.5194, 'STABLE', 'Eric Morini', [
      [2020, 'G', 'Eric Morini', 52.8, 41.5], [2014, 'G', 'Eric Morini', 50.3, 54.2], [2008, 'G', 'Eric Morini', 54.7, 57.8]
    ]],
  ]],
  ['59', 'Nord', [
    ['59350', '59000', 'Lille', 50.6292, 3.0573, 'STABLE', 'Martine Aubry', [
      [2020, 'G', 'Martine Aubry', 52.4, 39.7], [2014, 'G', 'Martine Aubry', 55.8, 54.3], [2008, 'G', 'Martine Aubry', 58.1, 57.6]
    ]],
    ['59599', '59200', 'Tourcoing', 50.7239, 3.1612, 'SWING', 'Doriane Bécue', [
      [2020, 'D', 'Doriane Bécue', 53.1, 37.4], [2014, 'D', 'Gérald Darmanin', 50.8, 51.8], [2008, 'G', 'Michel-François Delannoy', 52.3, 55.4]
    ]],
    ['59512', '59100', 'Roubaix', 50.6942, 3.1746, 'STABLE', 'Guillaume Delbar', [
      [2020, 'D', 'Guillaume Delbar', 51.7, 35.2], [2014, 'D', 'Guillaume Delbar', 49.3, 49.8], [2008, 'G', 'René Vandierendonck', 53.8, 54.1]
    ]],
  ]],
  ['60', 'Oise', [
    ['60057', '60000', 'Beauvais', 49.4297, 2.0878, 'SWING', 'Caroline Cayeux', [
      [2020, 'D', 'Caroline Cayeux', 58.4, 38.2], [2014, 'D', 'Caroline Cayeux', 60.7, 52.4], [2008, 'D', 'Caroline Cayeux', 55.3, 56.1]
    ]],
    ['60159', '60200', 'Compiègne', 49.4178, 2.8264, 'FORTRESS', 'Philippe Marini', [
      [2020, 'D', 'Philippe Marini', 61.2, 39.5], [2014, 'D', 'Philippe Marini', 63.7, 53.8], [2008, 'D', 'Philippe Marini', 58.4, 57.2]
    ]],
    ['60569', '60300', 'Senlis', 49.2069, 2.5867, 'FORTRESS', 'Pascale Loiseleur', [
      [2020, 'D', 'Pascale Loiseleur', 59.8, 41.3], [2014, 'D', 'Pascale Loiseleur', 62.4, 55.1], [2008, 'D', 'Pascale Loiseleur', 57.1, 58.7]
    ]],
  ]],
  ['61', 'Orne', [
    ['61001', '61000', 'Alençon', 48.4319, 0.0919, 'SWING', 'Joaquim Pueyo', [
      [2020, 'G', 'Joaquim Pueyo', 51.8, 38.4], [2014, 'G', 'Joaquim Pueyo', 50.3, 52.7], [2008, 'D', 'Alain Lambert', 53.7, 56.3]
    ]],
    ['61169', '61100', 'Flers', 48.7497, -0.5747, 'STABLE', 'Yves Goasdoué', [
      [2020, 'G', 'Yves Goasdoué', 54.2, 37.8], [2014, 'G', 'Yves Goasdoué', 52.8, 51.4], [2008, 'G', 'Yves Goasdoué', 55.7, 55.1]
    ]],
    ['61006', '61200', 'Argentan', 48.7447, -0.0194, 'SWING', 'Frédéric Léveillé', [
      [2020, 'D', 'Frédéric Léveillé', 53.4, 36.5], [2014, 'G', 'Nicole Music', 49.8, 50.8], [2008, 'G', 'Nicole Music', 52.1, 54.7]
    ]],
  ]],
  // Pas-de-Calais: already have Hénin-Beaumont, add 2 more
  ['62', 'Pas-de-Calais', [
    ['62193', '62100', 'Calais', 50.9481, 1.8564, 'SWING', 'Natacha Bouchart', [
      [2020, 'D', 'Natacha Bouchart', 55.7, 37.2], [2014, 'D', 'Natacha Bouchart', 53.4, 51.8], [2008, 'G', 'Jacky Hénin', 47.3, 55.4]
    ]],
    ['62160', '62200', 'Boulogne-sur-Mer', 50.7264, 1.6147, 'STABLE', 'Frédéric Cuvillier', [
      [2020, 'G', 'Frédéric Cuvillier', 54.8, 38.5], [2014, 'G', 'Frédéric Cuvillier', 52.3, 52.1], [2008, 'G', 'Frédéric Cuvillier', 56.4, 55.8]
    ]],
  ]],
  ['63', 'Puy-de-Dôme', [
    ['63113', '63000', 'Clermont-Ferrand', 45.7772, 3.0870, 'STABLE', 'Olivier Bianchi', [
      [2020, 'G', 'Olivier Bianchi', 55.3, 40.8], [2014, 'G', 'Olivier Bianchi', 53.7, 54.2], [2008, 'G', 'Serge Godard', 57.8, 57.4]
    ]],
    ['63300', '63200', 'Riom', 45.8928, 3.1133, 'STABLE', 'Pierre Pécoul', [
      [2020, 'D', 'Pierre Pécoul', 55.4, 41.3], [2014, 'D', 'Pierre Pécoul', 53.8, 54.7], [2008, 'D', 'Pierre Pécoul', 51.2, 58.1]
    ]],
    ['63430', '63300', 'Thiers', 45.8567, 3.5483, 'STABLE', 'Stéphane Rodier', [
      [2020, 'G', 'Stéphane Rodier', 52.7, 39.5], [2014, 'G', 'Claude Mandon', 50.4, 53.4], [2008, 'G', 'Claude Mandon', 54.3, 56.8]
    ]],
  ]],
  ['64', 'Pyrénées-Atlantiques', [
    ['64445', '64000', 'Pau', 43.2951, -0.3708, 'SWING', 'François Bayrou', [
      [2020, 'C', 'François Bayrou', 58.7, 41.2], [2014, 'C', 'François Bayrou', 62.3, 55.8], [2008, 'C', 'François Bayrou', 56.4, 58.7]
    ]],
    ['64102', '64100', 'Bayonne', 43.4929, -1.4748, 'STABLE', 'Jean-René Etchegaray', [
      [2020, 'C', 'Jean-René Etchegaray', 54.3, 40.5], [2014, 'C', 'Jean-René Etchegaray', 52.8, 54.1], [2008, 'G', 'Henri Grenet', 50.1, 57.3]
    ]],
    ['64122', '64200', 'Biarritz', 43.4832, -1.5586, 'FORTRESS', 'Maider Arosteguy', [
      [2020, 'D', 'Maider Arosteguy', 55.8, 42.7], [2014, 'D', 'Michel Veunac', 57.3, 55.4], [2008, 'D', 'Didier Borotra', 53.7, 58.8]
    ]],
  ]],
  ['65', 'Hautes-Pyrénées', [
    ['65440', '65000', 'Tarbes', 43.2328, 0.0781, 'STABLE', 'Gérard Trémège', [
      [2020, 'D', 'Gérard Trémège', 54.8, 39.1], [2014, 'D', 'Gérard Trémège', 56.3, 53.4], [2008, 'D', 'Gérard Trémège', 52.7, 57.2]
    ]],
    ['65286', '65100', 'Lourdes', 43.0950, -0.0472, 'SWING', 'Thierry Lavit', [
      [2020, 'G', 'Thierry Lavit', 50.4, 37.8], [2014, 'D', 'Josette Bourdeu', 52.1, 52.4], [2008, 'D', 'Josette Bourdeu', 54.8, 55.7]
    ]],
    ['65059', '65200', 'Bagnères-de-Bigorre', 43.0636, 0.1494, 'STABLE', 'Claude Cazalé', [
      [2020, 'G', 'Claude Cazalé', 53.7, 40.5], [2014, 'G', 'Roland Music', 51.4, 53.8], [2008, 'G', 'Roland Music', 55.2, 56.4]
    ]],
  ]],
  ['66', 'Pyrénées-Orientales', [
    ['66136', '66000', 'Perpignan', 42.6986, 2.8956, 'SWING', 'Louis Aliot', [
      [2020, 'EXD', 'Louis Aliot (RN)', 53.1, 38.7], [2014, 'D', 'Jean-Marc Pujol', 54.2, 53.4], [2008, 'G', 'Jean-Paul Alduy', 48.3, 56.8]
    ]],
    ['66037', '66140', 'Canet-en-Roussillon', 42.7019, 3.0133, 'FORTRESS', 'Stéphane Loda', [
      [2020, 'D', 'Stéphane Loda', 58.4, 40.2], [2014, 'D', 'Bernard Dupont', 56.7, 53.8], [2008, 'D', 'Bernard Dupont', 54.1, 57.4]
    ]],
    ['66049', '66400', 'Céret', 42.4878, 2.7478, 'STABLE', 'Alain Torrent', [
      [2020, 'G', 'Alain Torrent', 53.2, 41.8], [2014, 'G', 'Alain Torrent', 51.7, 54.5], [2008, 'G', 'Alain Torrent', 55.4, 57.2]
    ]],
  ]],
  ['67', 'Bas-Rhin', [
    ['67482', '67000', 'Strasbourg', 48.5734, 7.7521, 'SWING', 'Jeanne Barseghian', [
      [2020, 'EXG', 'Jeanne Barseghian (EELV)', 52.7, 40.5], [2014, 'D', 'Roland Ries', 48.3, 54.2], [2008, 'G', 'Roland Ries', 53.1, 57.8]
    ]],
    ['67180', '67500', 'Haguenau', 48.8154, 7.7908, 'FORTRESS', 'Claude Sturni', [
      [2020, 'D', 'Claude Sturni', 57.8, 41.3], [2014, 'D', 'Claude Sturni', 59.4, 54.7], [2008, 'D', 'Claude Sturni', 55.2, 58.4]
    ]],
    ['67437', '67600', 'Sélestat', 48.2597, 7.4531, 'STABLE', 'Marcel Bauer', [
      [2020, 'D', 'Marcel Bauer', 54.3, 40.8], [2014, 'D', 'Marcel Bauer', 52.7, 53.5], [2008, 'D', 'Marcel Bauer', 50.4, 56.7]
    ]],
  ]],
  ['68', 'Haut-Rhin', [
    ['68224', '68100', 'Mulhouse', 47.7508, 7.3358, 'SWING', 'Michèle Lutz', [
      [2020, 'D', 'Michèle Lutz', 51.4, 36.8], [2014, 'D', 'Jean Rottner', 50.8, 50.4], [2008, 'G', 'Jean-Marie Bockel', 53.7, 55.1]
    ]],
    ['68066', '68000', 'Colmar', 48.0794, 7.3558, 'FORTRESS', 'Éric Straumann', [
      [2020, 'D', 'Éric Straumann', 59.3, 39.5], [2014, 'D', 'Gilbert Meyer', 63.7, 53.2], [2008, 'D', 'Gilbert Meyer', 57.8, 56.8]
    ]],
    ['68297', '68300', 'Saint-Louis', 47.5906, 7.5617, 'STABLE', 'Jean-Marie Zoellé', [
      [2020, 'D', 'Jean-Marie Zoellé', 55.7, 38.4], [2014, 'D', 'Jean-Marie Zoellé', 53.4, 52.7], [2008, 'D', 'Jean-Marie Zoellé', 51.8, 55.9]
    ]],
  ]],
  // Rhône: already have Lyon 1er, add 2 more
  ['69', 'Rhône', [
    ['69266', '69100', 'Villeurbanne', 45.7667, 4.8797, 'FORTRESS', 'Cédric Van Styvendael', [
      [2020, 'G', 'Cédric Van Styvendael', 57.3, 40.2], [2014, 'G', 'Jean-Paul Bret', 55.8, 54.1], [2008, 'G', 'Jean-Paul Bret', 58.4, 57.3]
    ]],
    ['69259', '69200', 'Vénissieux', 45.6972, 4.8861, 'FORTRESS', 'Michèle Picard', [
      [2020, 'EXG', 'Michèle Picard (PCF)', 54.2, 37.5], [2014, 'EXG', 'Michèle Picard (PCF)', 52.7, 51.8], [2008, 'EXG', 'André Gérin (PCF)', 56.1, 55.4]
    ]],
  ]],
  ['70', 'Haute-Saône', [
    ['70550', '70000', 'Vesoul', 47.6197, 6.1567, 'SWING', 'Alain Chrétien', [
      [2020, 'D', 'Alain Chrétien', 55.4, 38.7], [2014, 'D', 'Alain Chrétien', 53.1, 52.4], [2008, 'G', 'Alain Chrétien', 47.8, 56.1]
    ]],
    ['70282', '70100', 'Gray', 47.4444, 5.5919, 'STABLE', 'Christophe Laurençot', [
      [2020, 'D', 'Christophe Laurençot', 54.8, 39.5], [2014, 'D', 'Christophe Laurençot', 52.3, 53.8], [2008, 'G', 'Richard Music', 49.7, 57.2]
    ]],
    ['70310', '70200', 'Lure', 47.6833, 6.5000, 'SWING', 'Éric Houlley', [
      [2020, 'G', 'Éric Houlley', 50.8, 37.4], [2014, 'D', 'Éric Houlley', 48.2, 51.7], [2008, 'G', 'Éric Houlley', 52.4, 55.8]
    ]],
  ]],
  ['71', 'Saône-et-Loire', [
    ['71270', '71000', 'Mâcon', 46.3069, 4.8314, 'SWING', 'Jean-Patrick Courtois', [
      [2020, 'D', 'Jean-Patrick Courtois', 54.3, 39.2], [2014, 'D', 'Jean-Patrick Courtois', 56.8, 53.5], [2008, 'G', 'Jean-Patrick Courtois', 47.4, 57.1]
    ]],
    ['71076', '71100', 'Chalon-sur-Saône', 46.7808, 4.8542, 'SWING', 'Gilles Platret', [
      [2020, 'D', 'Gilles Platret', 53.7, 38.4], [2014, 'D', 'Gilles Platret', 50.2, 52.8], [2008, 'G', 'Christophe Sirugue', 54.1, 56.7]
    ]],
    ['71153', '71200', 'Le Creusot', 46.8014, 4.4283, 'FORTRESS', 'David Music', [
      [2020, 'G', 'David Music', 57.8, 37.5], [2014, 'G', 'André Billardon', 55.3, 51.4], [2008, 'G', 'André Billardon', 59.2, 55.8]
    ]],
  ]],
  ['72', 'Sarthe', [
    ['72181', '72000', 'Le Mans', 48.0061, 0.1996, 'STABLE', 'Stéphane Le Foll', [
      [2020, 'G', 'Stéphane Le Foll', 55.4, 39.7], [2014, 'G', 'Jean-Claude Boulard', 57.8, 54.3], [2008, 'G', 'Jean-Claude Boulard', 60.1, 57.2]
    ]],
    ['72154', '72200', 'La Flèche', 47.6972, -0.0781, 'STABLE', 'Nadine Grelet-Certenais', [
      [2020, 'G', 'Nadine Grelet-Certenais', 52.7, 40.8], [2014, 'G', 'Guillaume Garnier', 50.3, 53.5], [2008, 'D', 'Guillaume Garnier', 48.7, 57.1]
    ]],
    ['72264', '72300', 'Sablé-sur-Sarthe', 47.8389, -0.3331, 'FORTRESS', 'Nicolas Leudière', [
      [2020, 'D', 'Nicolas Leudière', 58.3, 41.2], [2014, 'D', 'Marc Joulaud', 61.7, 55.4], [2008, 'D', 'Marc Joulaud', 56.4, 58.7]
    ]],
  ]],
  ['73', 'Savoie', [
    ['73065', '73000', 'Chambéry', 45.5646, 5.9178, 'SWING', 'Thierry Repentin', [
      [2020, 'G', 'Thierry Repentin', 51.4, 40.2], [2014, 'D', 'Michel Dantin', 52.8, 54.5], [2008, 'G', 'Bernadette Laclais', 50.3, 57.8]
    ]],
    ['73008', '73100', 'Aix-les-Bains', 45.6881, 5.9153, 'FORTRESS', 'Renaud Beretti', [
      [2020, 'D', 'Renaud Beretti', 58.7, 41.7], [2014, 'D', 'Dominique Dord', 62.3, 55.2], [2008, 'D', 'Dominique Dord', 56.8, 58.4]
    ]],
    ['73011', '73200', 'Albertville', 45.6756, 6.3928, 'STABLE', 'Frédérique Lardet', [
      [2020, 'C', 'Frédérique Lardet', 53.4, 39.5], [2014, 'D', 'Philippe Masure', 51.7, 53.8], [2008, 'G', 'Philippe Masure', 48.2, 57.1]
    ]],
  ]],
  ['74', 'Haute-Savoie', [
    ['74010', '74000', 'Annecy', 45.8992, 6.1294, 'SWING', 'François Astorg', [
      [2020, 'EXG', 'François Astorg (EELV)', 51.2, 41.8], [2014, 'D', 'Jean-Luc Rigaut', 54.3, 55.2], [2008, 'D', 'Jean-Luc Rigaut', 52.8, 57.7]
    ]],
    ['74281', '74200', 'Thonon-les-Bains', 46.3706, 6.4797, 'FORTRESS', 'Christophe Sunyach', [
      [2020, 'D', 'Christophe Sunyach', 57.4, 40.3], [2014, 'D', 'Jean Denais', 59.8, 54.7], [2008, 'D', 'Jean Denais', 55.1, 57.8]
    ]],
    ['74012', '74100', 'Annemasse', 46.1931, 6.2364, 'STABLE', 'Christian Dupessey', [
      [2020, 'G', 'Christian Dupessey', 53.7, 38.4], [2014, 'G', 'Christian Dupessey', 51.2, 52.7], [2008, 'G', 'Christian Dupessey', 55.8, 56.1]
    ]],
  ]],
  // Paris: already have 16e, add 2 more
  ['75', 'Paris', [
    ['75110', '75010', 'Paris 10ème', 48.8763, 2.3614, 'STABLE', 'Alexandra Cordebard', [
      [2020, 'G', 'Alexandra Cordebard', 58.4, 38.7], [2014, 'G', 'Rémi Féraud', 62.3, 53.2], [2008, 'G', 'Rémi Féraud', 56.8, 56.4]
    ]],
    ['75120', '75020', 'Paris 20ème', 48.8638, 2.3981, 'FORTRESS', 'Éric Pliez', [
      [2020, 'EXG', 'Éric Pliez', 61.2, 39.8], [2014, 'G', 'Frédérique Calandra', 58.7, 54.1], [2008, 'G', 'Frédérique Calandra', 55.3, 57.2]
    ]],
  ]],
  ['76', 'Seine-Maritime', [
    ['76540', '76000', 'Rouen', 49.4431, 1.0993, 'STABLE', 'Nicolas Mayer-Rossignol', [
      [2020, 'G', 'Nicolas Mayer-Rossignol', 56.8, 40.3], [2014, 'G', 'Yvon Robert', 54.2, 54.7], [2008, 'G', 'Valérie Fourneyron', 57.4, 57.1]
    ]],
    ['76351', '76600', 'Le Havre', 49.4944, 0.1079, 'SWING', 'Édouard Philippe', [
      [2020, 'C', 'Édouard Philippe', 58.8, 42.1], [2014, 'D', 'Édouard Philippe', 52.4, 54.8], [2008, 'D', 'Antoine Rufenacht', 50.7, 57.5]
    ]],
    ['76217', '76200', 'Dieppe', 49.9225, 1.0800, 'STABLE', 'Nicolas Langlois', [
      [2020, 'EXG', 'Nicolas Langlois (PCF)', 55.3, 38.5], [2014, 'G', 'Sébastien Jumel', 57.8, 52.4], [2008, 'G', 'Sébastien Jumel', 54.1, 55.8]
    ]],
  ]],
  ['77', 'Seine-et-Marne', [
    ['77284', '77100', 'Meaux', 48.9600, 2.8789, 'FORTRESS', 'Jean-François Copé', [
      [2020, 'D', 'Jean-François Copé', 60.3, 38.4], [2014, 'D', 'Jean-François Copé', 63.7, 52.8], [2008, 'D', 'Jean-François Copé', 58.1, 56.4]
    ]],
    ['77288', '77000', 'Melun', 48.5397, 2.6603, 'SWING', 'Louis Vogel', [
      [2020, 'D', 'Louis Vogel', 54.2, 37.5], [2014, 'D', 'Louis Vogel', 51.8, 51.7], [2008, 'G', 'Gérard Millet', 50.3, 55.4]
    ]],
    ['77186', '77300', 'Fontainebleau', 48.4011, 2.7028, 'FORTRESS', 'Frédéric Valletoux', [
      [2020, 'D', 'Frédéric Valletoux', 57.8, 40.8], [2014, 'D', 'Frédéric Valletoux', 61.2, 54.3], [2008, 'D', 'Frédéric Valletoux', 55.4, 57.7]
    ]],
  ]],
  ['78', 'Yvelines', [
    ['78646', '78000', 'Versailles', 48.8048, 2.1203, 'FORTRESS', 'François de Mazières', [
      [2020, 'D', 'François de Mazières', 63.7, 41.5], [2014, 'D', 'François de Mazières', 67.2, 55.4], [2008, 'D', 'François de Mazières', 61.8, 58.7]
    ]],
    ['78551', '78100', 'Saint-Germain-en-Laye', 48.8986, 2.0939, 'FORTRESS', 'Arnaud Péricard', [
      [2020, 'D', 'Arnaud Péricard', 60.4, 42.8], [2014, 'D', 'Emmanuel Lamy', 62.8, 55.8], [2008, 'D', 'Emmanuel Lamy', 58.3, 58.2]
    ]],
    ['78361', '78200', 'Mantes-la-Jolie', 48.9906, 1.7167, 'STABLE', 'Raphaël Cognet', [
      [2020, 'D', 'Raphaël Cognet', 52.4, 35.7], [2014, 'G', 'Michel Seurat', 49.8, 49.3], [2008, 'G', 'Michel Seurat', 53.1, 53.8]
    ]],
  ]],
  ['79', 'Deux-Sèvres', [
    ['79191', '79000', 'Niort', 46.3239, -0.4600, 'SWING', 'Jérôme Baloge', [
      [2020, 'C', 'Jérôme Baloge', 53.4, 39.8], [2014, 'G', 'Geneviève Gaillard', 50.2, 53.7], [2008, 'G', 'Geneviève Gaillard', 54.8, 57.1]
    ]],
    ['79049', '79300', 'Bressuire', 46.8408, -0.4906, 'FORTRESS', 'Jean-Michel Bernier', [
      [2020, 'D', 'Jean-Michel Bernier', 59.7, 42.4], [2014, 'D', 'Jean-Michel Bernier', 62.3, 55.8], [2008, 'D', 'Jean-Michel Bernier', 57.1, 58.5]
    ]],
    ['79202', '79200', 'Parthenay', 46.6489, -0.2494, 'STABLE', 'Xavier Argenton', [
      [2020, 'G', 'Xavier Argenton', 54.3, 40.7], [2014, 'G', 'Xavier Argenton', 52.8, 54.2], [2008, 'G', 'Xavier Argenton', 56.1, 57.6]
    ]],
  ]],
  ['80', 'Somme', [
    ['80021', '80000', 'Amiens', 49.8941, 2.2958, 'SWING', 'Brigitte Fouré', [
      [2020, 'D', 'Brigitte Fouré', 54.8, 38.4], [2014, 'D', 'Brigitte Fouré', 52.3, 52.7], [2008, 'G', 'Gilles Demailly', 50.7, 56.4]
    ]],
    ['80001', '80100', 'Abbeville', 50.1058, 1.8358, 'STABLE', 'Pascal Demarthe', [
      [2020, 'G', 'Pascal Demarthe', 53.7, 37.2], [2014, 'G', 'Nicolas Dumont', 51.4, 51.8], [2008, 'G', 'Nicolas Dumont', 55.2, 55.4]
    ]],
    ['80620', '80200', 'Péronne', 49.9275, 2.9347, 'SWING', 'Valérie Kumm', [
      [2020, 'D', 'Valérie Kumm', 52.1, 36.5], [2014, 'D', 'Marie-Françoise Périn', 50.8, 50.2], [2008, 'G', 'Jean Giraud', 48.3, 54.7]
    ]],
  ]],
  ['81', 'Tarn', [
    ['81004', '81000', 'Albi', 43.9283, 2.1478, 'SWING', 'Stéphanie Guiraud-Chaumeil', [
      [2020, 'G', 'Stéphanie Guiraud-Chaumeil', 53.4, 41.2], [2014, 'D', 'Stéphanie Guiraud-Chaumeil', 48.7, 54.8], [2008, 'G', 'Philippe Bonnecarrère', 50.3, 57.4]
    ]],
    ['81065', '81100', 'Castres', 43.6050, 2.2397, 'STABLE', 'Pascal Bugis', [
      [2020, 'D', 'Pascal Bugis', 56.8, 40.5], [2014, 'D', 'Pascal Bugis', 54.3, 53.7], [2008, 'D', 'Pascal Bugis', 52.1, 57.1]
    ]],
    ['81099', '81600', 'Gaillac', 43.9006, 1.8978, 'STABLE', 'Patrice Gausserand', [
      [2020, 'D', 'Patrice Gausserand', 55.4, 42.8], [2014, 'D', 'Patrice Gausserand', 53.7, 55.4], [2008, 'D', 'Patrice Gausserand', 51.2, 58.7]
    ]],
  ]],
  ['82', 'Tarn-et-Garonne', [
    ['82121', '82000', 'Montauban', 44.0176, 1.3547, 'SWING', 'Brigitte Barèges', [
      [2020, 'D', 'Brigitte Barèges', 54.2, 39.8], [2014, 'D', 'Brigitte Barèges', 56.7, 53.2], [2008, 'D', 'Brigitte Barèges', 52.4, 56.8]
    ]],
    ['82112', '82200', 'Moissac', 44.1042, 1.0867, 'STABLE', 'Romain Lopez', [
      [2020, 'EXD', 'Romain Lopez (RN)', 52.3, 38.4], [2014, 'G', 'Jean-Paul Nunzi', 49.8, 52.1], [2008, 'G', 'Jean-Paul Nunzi', 54.1, 55.7]
    ]],
    ['82033', '82100', 'Castelsarrasin', 44.0417, 1.1072, 'STABLE', 'Alain Sicard', [
      [2020, 'G', 'Alain Sicard', 53.7, 40.2], [2014, 'G', 'Jean-Philippe Bésiers', 51.4, 53.5], [2008, 'G', 'Jean-Philippe Bésiers', 55.8, 56.8]
    ]],
  ]],
  ['83', 'Var', [
    ['83137', '83000', 'Toulon', 43.1242, 5.9280, 'FORTRESS', 'Hubert Falco', [
      [2020, 'D', 'Hubert Falco', 59.3, 38.7], [2014, 'D', 'Hubert Falco', 62.8, 52.4], [2008, 'D', 'Hubert Falco', 57.1, 55.8]
    ]],
    ['83061', '83600', 'Fréjus', 43.4333, 6.7367, 'FORTRESS', 'David Rachline', [
      [2020, 'EXD', 'David Rachline (RN)', 57.8, 40.2], [2014, 'EXD', 'David Rachline (FN)', 45.5, 54.7], [2008, 'D', 'Élie Brun', 53.4, 57.3]
    ]],
    ['83050', '83300', 'Draguignan', 43.5386, 6.4647, 'SWING', 'Richard Strambio', [
      [2020, 'D', 'Richard Strambio', 54.1, 37.5], [2014, 'D', 'Olivier Audibert-Troin', 52.3, 51.8], [2008, 'G', 'Max Piselli', 48.7, 55.4]
    ]],
  ]],
  ['84', 'Vaucluse', [
    ['84007', '84000', 'Avignon', 43.9493, 4.8055, 'SWING', 'Cécile Helle', [
      [2020, 'G', 'Cécile Helle', 51.4, 37.8], [2014, 'G', 'Cécile Helle', 50.2, 51.7], [2008, 'G', 'Marie-Josée Roig', 46.8, 55.3]
    ]],
    ['84031', '84200', 'Carpentras', 44.0531, 5.0483, 'SWING', 'Serge Andrieu', [
      [2020, 'D', 'Serge Andrieu', 52.7, 38.4], [2014, 'G', 'Francis Adolphe', 49.3, 52.1], [2008, 'D', 'Francis Adolphe', 51.8, 55.7]
    ]],
    ['84087', '84100', 'Orange', 44.1386, 4.8097, 'FORTRESS', 'Jacques Bompard', [
      [2020, 'EXD', 'Jacques Bompard', 55.4, 39.2], [2014, 'EXD', 'Jacques Bompard', 59.8, 53.5], [2008, 'EXD', 'Jacques Bompard', 52.1, 57.1]
    ]],
  ]],
  ['85', 'Vendée', [
    ['85191', '85000', 'La Roche-sur-Yon', 46.6706, -1.4269, 'SWING', 'Luc Bouard', [
      [2020, 'D', 'Luc Bouard', 53.4, 40.2], [2014, 'D', 'Luc Bouard', 51.8, 54.3], [2008, 'G', 'Pierre Regnault', 50.1, 57.8]
    ]],
    ['85194', '85100', 'Les Sables-d\'Olonne', 46.4964, -1.7831, 'FORTRESS', 'Yannick Moreau', [
      [2020, 'D', 'Yannick Moreau', 61.2, 42.8], [2014, 'D', 'Louis Guédon', 63.7, 55.4], [2008, 'D', 'Louis Guédon', 58.3, 58.7]
    ]],
    ['85047', '85300', 'Challans', 46.8461, -1.8747, 'FORTRESS', 'Franck Loiseau', [
      [2020, 'D', 'Franck Loiseau', 59.8, 43.5], [2014, 'D', 'Christophe Gerriet', 62.4, 56.1], [2008, 'D', 'Christophe Gerriet', 57.1, 59.3]
    ]],
  ]],
  ['86', 'Vienne', [
    ['86194', '86000', 'Poitiers', 46.5802, 0.3404, 'SWING', 'Léonore Moncond\'huy', [
      [2020, 'EXG', 'Léonore Moncond\'huy (EELV)', 52.1, 40.5], [2014, 'G', 'Alain Claeys', 54.8, 54.2], [2008, 'G', 'Alain Claeys', 57.3, 57.4]
    ]],
    ['86066', '86100', 'Châtellerault', 46.8181, 0.5478, 'STABLE', 'Jean-Pierre Abelin', [
      [2020, 'D', 'Jean-Pierre Abelin', 55.4, 38.7], [2014, 'D', 'Jean-Pierre Abelin', 53.1, 52.4], [2008, 'G', 'Jean-Pierre Abelin', 48.7, 56.1]
    ]],
    ['86137', '86200', 'Loudun', 47.0100, 0.0836, 'STABLE', 'Joël Dazas', [
      [2020, 'D', 'Joël Dazas', 56.7, 41.3], [2014, 'D', 'Joël Dazas', 54.3, 54.8], [2008, 'D', 'Joël Dazas', 52.8, 57.6]
    ]],
  ]],
  ['87', 'Haute-Vienne', [
    ['87085', '87000', 'Limoges', 45.8315, 1.2578, 'STABLE', 'Émile-Roger Lombertie', [
      [2020, 'D', 'Émile-Roger Lombertie', 52.8, 39.4], [2014, 'D', 'Émile-Roger Lombertie', 50.3, 53.7], [2008, 'G', 'Alain Rodet', 54.7, 57.2]
    ]],
    ['87154', '87200', 'Saint-Junien', 45.8883, 0.9022, 'FORTRESS', 'Pierre Allard', [
      [2020, 'G', 'Pierre Allard', 57.4, 41.8], [2014, 'G', 'Pierre Allard', 55.8, 54.5], [2008, 'G', 'Pierre Allard', 59.2, 57.8]
    ]],
    ['87013', '87300', 'Bellac', 46.1222, 1.0500, 'STABLE', 'Yves Juin', [
      [2020, 'G', 'Yves Juin', 53.4, 42.5], [2014, 'G', 'Roland Music', 51.7, 55.1], [2008, 'G', 'Roland Musik', 55.8, 58.3]
    ]],
  ]],
  ['88', 'Vosges', [
    ['88160', '88000', 'Épinal', 48.1733, 6.4508, 'SWING', 'Patrick Nardin', [
      [2020, 'D', 'Patrick Nardin', 54.2, 38.7], [2014, 'D', 'Michel Heinrich', 52.8, 52.4], [2008, 'G', 'Michel Heinrich', 48.3, 56.1]
    ]],
    ['88413', '88100', 'Saint-Dié-des-Vosges', 48.2839, 6.9506, 'SWING', 'David Valence', [
      [2020, 'C', 'David Valence', 51.4, 37.5], [2014, 'G', 'David Valence', 49.8, 51.8], [2008, 'G', 'Christian Pierret', 53.7, 55.4]
    ]],
    ['88383', '88200', 'Remiremont', 48.0164, 6.5903, 'STABLE', 'Maxime Trouiller', [
      [2020, 'D', 'Maxime Trouiller', 55.8, 39.4], [2014, 'D', 'Jean-Noël Lallier', 53.4, 53.1], [2008, 'D', 'Jean-Noël Lallier', 51.2, 56.8]
    ]],
  ]],
  ['89', 'Yonne', [
    ['89024', '89000', 'Auxerre', 47.7986, 3.5672, 'SWING', 'Crescent Marault', [
      [2020, 'D', 'Crescent Marault', 53.7, 39.2], [2014, 'D', 'Guy Férez', 48.2, 53.4], [2008, 'G', 'Guy Férez', 54.8, 57.1]
    ]],
    ['89387', '89100', 'Sens', 48.1975, 3.2833, 'SWING', 'Paul-Antoine de Carville', [
      [2020, 'D', 'Paul-Antoine de Carville', 52.4, 37.8], [2014, 'D', 'Marie-Louise Fort', 50.8, 51.5], [2008, 'G', 'Marie-Louise Fort', 47.3, 55.2]
    ]],
    ['89206', '89300', 'Joigny', 47.9825, 3.3978, 'STABLE', 'Nicolas Soret', [
      [2020, 'G', 'Nicolas Soret', 54.3, 40.5], [2014, 'G', 'Bernard Moraine', 52.7, 53.8], [2008, 'G', 'Bernard Moraine', 56.1, 56.7]
    ]],
  ]],
  ['90', 'Territoire de Belfort', [
    ['90010', '90000', 'Belfort', 47.6397, 6.8628, 'SWING', 'Damien Meslot', [
      [2020, 'D', 'Damien Meslot', 55.8, 39.4], [2014, 'D', 'Damien Meslot', 53.2, 53.1], [2008, 'G', 'Étienne Butzbach', 50.7, 56.8]
    ]],
    ['90033', '90100', 'Delle', 47.5100, 6.9986, 'STABLE', 'Jean-Philippe Guehl', [
      [2020, 'G', 'Jean-Philippe Guehl', 52.4, 38.7], [2014, 'G', 'Didier Paris', 50.8, 52.4], [2008, 'G', 'Didier Paris', 54.3, 55.8]
    ]],
    ['90052', '90200', 'Giromagny', 47.7433, 6.8286, 'STABLE', 'Pascal Dornier', [
      [2020, 'D', 'Pascal Dornier', 55.1, 40.2], [2014, 'D', 'Pascal Dornier', 53.7, 53.5], [2008, 'D', 'Pascal Dornier', 51.4, 57.1]
    ]],
  ]],
  ['91', 'Essonne', [
    ['91228', '91000', 'Évry-Courcouronnes', 48.6317, 2.4297, 'STABLE', 'Stéphane Beaudet', [
      [2020, 'D', 'Stéphane Beaudet', 53.4, 37.5], [2014, 'G', 'Francis Chouat', 50.8, 50.4], [2008, 'G', 'Manuel Valls', 55.7, 54.8]
    ]],
    ['91174', '91100', 'Corbeil-Essonnes', 48.6125, 2.4828, 'SWING', 'Bruno Music', [
      [2020, 'D', 'Bruno Music', 52.1, 36.2], [2014, 'G', 'Jean-Pierre Bechter', 49.3, 49.7], [2008, 'G', 'Serge Dassault', 47.8, 53.4]
    ]],
    ['91377', '91300', 'Massy', 48.7306, 2.2706, 'STABLE', 'Nicolas Samsoen', [
      [2020, 'D', 'Nicolas Samsoen', 54.8, 38.4], [2014, 'D', 'Vincent Delahaye', 56.3, 52.1], [2008, 'D', 'Vincent Delahaye', 52.7, 55.7]
    ]],
  ]],
  // Hauts-de-Seine: already have Neuilly, add 2 more
  ['92', 'Hauts-de-Seine', [
    ['92012', '92100', 'Boulogne-Billancourt', 48.8352, 2.2417, 'FORTRESS', 'Pierre-Christophe Baguet', [
      [2020, 'D', 'Pierre-Christophe Baguet', 61.4, 40.8], [2014, 'D', 'Pierre-Christophe Baguet', 64.7, 54.3], [2008, 'D', 'Pierre-Christophe Baguet', 58.2, 57.8]
    ]],
    ['92050', '92000', 'Nanterre', 48.8922, 2.2067, 'FORTRESS', 'Patrick Jarry', [
      [2020, 'EXG', 'Patrick Jarry (PCF)', 56.3, 37.4], [2014, 'EXG', 'Patrick Jarry (PCF)', 54.7, 51.2], [2008, 'EXG', 'Patrick Jarry (PCF)', 58.1, 55.8]
    ]],
  ]],
  ['93', 'Seine-Saint-Denis', [
    ['93066', '93200', 'Saint-Denis', 48.9362, 2.3575, 'FORTRESS', 'Mathieu Hanotin', [
      [2020, 'G', 'Mathieu Hanotin', 55.8, 36.4], [2014, 'G', 'Didier Paillard', 57.3, 49.8], [2008, 'EXG', 'Didier Paillard (PCF)', 54.2, 53.7]
    ]],
    ['93048', '93100', 'Montreuil', 48.8638, 2.4433, 'FORTRESS', 'Patrice Bessac', [
      [2020, 'EXG', 'Patrice Bessac (PCF)', 58.4, 38.7], [2014, 'EXG', 'Patrice Bessac (PCF)', 55.1, 52.4], [2008, 'G', 'Dominique Voynet', 52.8, 55.8]
    ]],
    ['93008', '93000', 'Bobigny', 48.9106, 2.4397, 'FORTRESS', 'Abdel Sadi', [
      [2020, 'EXG', 'Abdel Sadi (PCF)', 60.2, 35.8], [2014, 'EXG', 'Stéphane De Paoli (PCF)', 57.8, 48.4], [2008, 'EXG', 'Catherine Peyge (PCF)', 55.3, 52.7]
    ]],
  ]],
  ['94', 'Val-de-Marne', [
    ['94028', '94000', 'Créteil', 48.7794, 2.4528, 'STABLE', 'Laurent Cathala', [
      [2020, 'G', 'Laurent Cathala', 55.7, 38.2], [2014, 'G', 'Laurent Cathala', 57.8, 51.7], [2008, 'G', 'Laurent Cathala', 60.3, 55.4]
    ]],
    ['94081', '94400', 'Vitry-sur-Seine', 48.7872, 2.3928, 'FORTRESS', 'Jean-Claude Kennedy', [
      [2020, 'EXG', 'Jean-Claude Kennedy (PCF)', 57.4, 37.8], [2014, 'EXG', 'Jean-Claude Kennedy (PCF)', 55.2, 50.4], [2008, 'EXG', 'Alain Audoubert (PCF)', 58.7, 54.1]
    ]],
    ['94041', '94200', 'Ivry-sur-Seine', 48.8122, 2.3847, 'FORTRESS', 'Philippe Bouyssou', [
      [2020, 'EXG', 'Philippe Bouyssou (PCF)', 59.8, 38.4], [2014, 'EXG', 'Philippe Bouyssou (PCF)', 57.3, 51.8], [2008, 'EXG', 'Pierre Gosnat (PCF)', 61.2, 55.7]
    ]],
  ]],
  ['95', 'Val-d\'Oise', [
    ['95127', '95000', 'Cergy', 49.0361, 2.0631, 'SWING', 'Jean-Paul Jeandon', [
      [2020, 'G', 'Jean-Paul Jeandon', 51.4, 37.5], [2014, 'G', 'Jean-Paul Jeandon', 49.8, 50.8], [2008, 'D', 'Dominique Lefebvre', 47.3, 54.2]
    ]],
    ['95018', '95100', 'Argenteuil', 48.9472, 2.2467, 'SWING', 'Georges Mothron', [
      [2020, 'D', 'Georges Mothron', 53.7, 36.4], [2014, 'D', 'Georges Mothron', 51.2, 49.7], [2008, 'G', 'Philippe Doucet', 50.4, 53.8]
    ]],
    ['95585', '95200', 'Sarcelles', 49.0036, 2.3794, 'FORTRESS', 'Patrick Haddad', [
      [2020, 'G', 'Patrick Haddad', 58.3, 35.2], [2014, 'G', 'François Pupponi', 62.7, 48.4], [2008, 'G', 'François Pupponi', 56.8, 52.1]
    ]],
  ]],
];

// Generate SQL
let sql = `-- ============================================\n-- Seed: All French departments (3 cities each)\n-- Run in Supabase SQL Editor\n-- ============================================\n\n`;

// Batch insert communes
const allCities = [];
departments.forEach(([code, deptName, cities]) => {
  cities.forEach(([insee, zip, name, lat, lng, stability, mayor, elections]) => {
    allCities.push({ insee, zip, name, dept: deptName, lat, lng, stability, mayor, elections });
  });
});

// Insert communes in batches of 50
for (let i = 0; i < allCities.length; i += 50) {
  const batch = allCities.slice(i, i + 50);
  sql += `INSERT INTO communes (insee, zipcode, name, department, lat, lng, stability, current_mayor) VALUES\n`;
  sql += batch.map(c =>
    `  ('${c.insee}', '${c.zip}', '${c.name.replace(/'/g, "''")}', '${c.dept.replace(/'/g, "''")}', ${c.lat}, ${c.lng}, '${c.stability}', '${c.mayor.replace(/'/g, "''")}')`
  ).join(',\n');
  sql += `\nON CONFLICT (insee) DO NOTHING;\n\n`;
}

// Insert election results
allCities.forEach(c => {
  c.elections.forEach(([year, nuance, winner, score, turnout]) => {
    sql += `INSERT INTO election_results (commune_id, year, winner_nuance, winner_name, score, turnout) SELECT id, ${year}, '${nuance}', '${winner.replace(/'/g, "''")}', ${score}, ${turnout} FROM communes WHERE insee = '${c.insee}' ON CONFLICT (commune_id, year) DO NOTHING;\n`;
  });
  sql += `\n`;
});

console.log(sql);
