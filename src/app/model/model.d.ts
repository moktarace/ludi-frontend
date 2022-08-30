export interface Show {
  id?: number | string;
  name?: string;
  location?: string;
  date?: number;
  description?: string;
  reservationLink?: string;
  price?: number;
  reducedPrice?: number;
  imgLink?: string;
  isHighlighted?: boolean;
  facebookLink?:string;
  freeForStudents?:boolean;
  bannerImgLink?:string;
  instagramLink?:string;
  isPublished?: boolean;
}
