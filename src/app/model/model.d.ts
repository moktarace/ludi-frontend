export interface Show {
  id?: number | string;
  name?: string;
  location?: string;
  date?: number;
  description?: string;
  shortDescription?: string;
  reservationLink?: string;
  price?: number;
  reducedPrice?: number;
  imgLink?: string;
  logoLink?: string;
  isHighlighted?: boolean;
  facebookLink?:string;
  freeForStudents?:boolean;
  bannerImgLink?:string;
  instagramLink?:string;
  isPublished?: boolean;
  candidacyLink?: string;
}

export interface Member {
  id?: number | string;
  firstName: string;
  lastName: string;
  emailAddress: string;
}

export interface CandidacyCall {
  id?: number | string;
  name?: string;
  location?: string;
  date?: number;
  deadline?: number;
  description?: string;
  isHighlighted?: boolean;
  isPublished?: boolean;
  kind: string;
  nbComedian: number;
  nbMC: number;
  nbArbitor: number;
  nbCoach: number;
}

export interface Candidacy {
  id?: number | string;
  candidacyCall: CandidacyCall;
  member: Member;
  asComedian?: boolean;
  asCoach?: boolean;
  asMC?: boolean;
  asArbitor?: boolean;
  joinedMember: Member;
  comment?: string;
}
