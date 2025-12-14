export type RootTabParamList = {
  Home: undefined;
  Wardrobe: undefined;
  Outfits: undefined;
};

export type WardrobeStackParamList = {
  WardrobeScreen: undefined;
  AddClothingItemScreen: undefined;
  EditClothingItemScreen: { itemId: string };
  ItemDetailsScreen: { itemId: string };
};

export type OutfitsStackParamList = {
  OutfitsScreen: undefined;
  AddOutfitScreen: undefined;
  EditOutfitScreen: { outfitId: string };
  OutfitDetailsScreen: { outfitId: string };
};


