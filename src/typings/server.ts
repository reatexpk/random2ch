export interface News {
  date: string;
  num: number;
  subject: string;
  views: number;
}

export interface File {
  displayname: string;
  duration: string;
  duration_secs: number;
  fullname: string;
  height: number;
  md5: string;
  name: string;
  nsfw: number;
  path: string;
  size: number;
  thumbnail: string;
  tn_height: number;
  tn_width: number;
  type: number;
  width: number;
}

export interface Thread {
  banned: number;
  closed: number;
  comment: string;
  date: string;
  email: string;
  endless: number;
  files: File[];
  files_count: number;
  lasthit: number;
  name: string;
  num: string;
  op: number;
  parent: string;
  posts_count: number;
  sticky: number;
  subject: string;
  tags: string;
  timestamp: number;
  trip: string;
}

export interface Top {
  board: string;
  info: string;
  name: string;
}

export interface GetThreadsResponse {
  Board: string;
  BoardInfo: string;
  BoardInfoOuter: string;
  BoardName: string;
  advert_bottom_image: string;
  advert_bottom_link: string;
  advert_mobile_image: string;
  advert_mobile_link: string;
  advert_top_image: string;
  advert_top_link: string;
  board_banner_image: string;
  board_banner_link: string;
  bump_limit: number;
  default_name: string;
  enable_dices: number;
  enable_flags: number;
  enable_icons: number;
  enable_images: number;
  enable_likes: number;
  enable_names: number;
  enable_oekaki: number;
  enable_posting: number;
  enable_sage: number;
  enable_shield: number;
  enable_subject: number;
  enable_thread_tags: number;
  enable_trips: number;
  enable_video: number;
  filter: string;
  max_comment: number;
  max_files_size: number;
  news_abu: News[];
  threads: Thread[];
  top: Top[];
}
