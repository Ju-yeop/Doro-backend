import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostInput, CreatePostOutut } from './dto/create-post.dto';
import {
  FindAllPostsInput,
  FindAllPostsOutput,
} from './dto/find-all-posts.dto';
import { FindPostInput, FindPostOutput } from './dto/find-post.dto';
import { Post } from './entity/post.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private posts: Repository<Post>, // @InjectRepository(Comment) // private Comment: Repository<Post>,
  ) {}
  async createPost(CreatePostInput: CreatePostInput): Promise<CreatePostOutut> {
    try {
      const newPost = this.posts.create(CreatePostInput);
      await this.posts.save(newPost);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'could not make post',
      };
    }
  }
  async findPost(FindPostInput: FindPostInput): Promise<FindPostOutput> {
    try {
      //password 입력이 없을때 즉 frontend에서 비밀글이 아니라고 판단했을때
      if (FindPostInput.password === null) {
        const post = await this.posts.findOne({
          where: {
            id: FindPostInput.postId,
          },
        }); //혹시 모르니까 해당글이 비밀글이 맞는지 아닌지를 backend측에서 한번더 검사한다.
        if (post.password === null) {
          return { ok: true, post };
        } else {
          return {
            ok: false,
            error: 'this post id locked you should input password',
          };
        }
      } else {
        //password 가 있을 경우  frontend에서 비밀글이라 판단했을때
        const post = await this.posts.findOne({
          where: {
            id: FindPostInput.postId,
          },
        });
        //만약 front에서 오류 났을때 비밀글이 아닌 글이 비밀글 처럼 보이게 된다면
        if (post.password === null) {
          return {
            ok: true,
            post,
          };
        }
        //입력받은 비밀번호 일치 여부에 따라 return
        if (FindPostInput.password === post.password) {
          return { ok: true, post };
        } else {
          return { ok: false, error: 'password is wrong' };
        }
      }
    } catch {
      return { ok: false, error: 'sorry we could not find post' };
    }
  }
  async findAllPosts({ page }: FindAllPostsInput): Promise<FindAllPostsOutput> {
    try {
      const [posts, totalResults] = await this.posts.findAndCount({
        skip: (page - 1) * 5,
        take: 5,
      });
      return {
        ok: true,
        results: posts,
        totalPages: Math.ceil(totalResults / 5),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'could not load posts',
      };
    }
  }
  // async updatePost() {}
  // async deletePost() {}
}
