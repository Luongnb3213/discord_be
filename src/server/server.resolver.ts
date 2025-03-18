import { ServerService } from './server.service';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Server } from './types';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/auth.guard';
import { GraphQLError } from 'graphql';
import {
  CreateChannelOnServerDto,
  CreateServerDto,
  UpdateServerDto,
} from './dto';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { createWriteStream, existsSync, mkdir, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MemberRole } from 'src/member/member.types';
@UseGuards(GraphqlAuthGuard)
@Resolver()
export class ServerResolver {
  constructor(private readonly serverService: ServerService) {}

  @Query(() => [Server])
  async getServers(@Context() ctx: { req: Request }) {
    if (!ctx.req?.profile.email) {
      return new GraphQLError('Profile not found');
    }

    return this.serverService.getServersByProfileEmailOfMember(
      ctx.req?.profile.email,
    );
  }

  @Mutation(() => Server)
  async createServer(
    @Args('input') input: CreateServerDto,
    @Args('file', { type: () => GraphQLUpload, nullable: true })
    file: GraphQLUpload,
  ) {
    if (!file) throw new GraphQLError('Image is required');
    const imageUrl = await this.storeImageAndGetUrl(file);

    return this.serverService.createServer(input, imageUrl);
  }

  async storeImageAndGetUrl(file: GraphQLUpload) {
    const { createReadStream, filename } = await file;
    const uniqueFilename = `${uuidv4()}_${filename}`;
    const imagePath = join(process.cwd(), 'public', 'images', uniqueFilename);
    const imageUrl = `${process.env.APP_URL}/images/${uniqueFilename}`;

    if (!existsSync(join(process.cwd(), 'public', 'images'))) {
      mkdirSync(join(process.cwd(), 'public', 'images'), { recursive: true });
    }

    const readStream = createReadStream();
    readStream.pipe(createWriteStream(imagePath));
    return imageUrl;
  }

  @Query(() => Server)
  async getServer(
    @Context() ctx: { req: Request },
    @Args('id', { nullable: true }) id: number,
  ) {
    if (!ctx.req?.profile.email) {
      return new GraphQLError('Profile not found');
    }
    return this.serverService.getServer(id, ctx.req?.profile.email);
  }

  @Mutation(() => Server)
  async updateServer(
    @Args('input') input: UpdateServerDto,
    @Args('file', { type: () => GraphQLUpload, nullable: true })
    file: GraphQLUpload,
  ) {
    let imageUrl;

    if (file) {
      imageUrl = await this.storeImageAndGetUrl(file);
    }
    try {
      return this.serverService.updateServer(input, imageUrl);
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => Server)
  async updateServerWithNewInviteCode(
    @Args('serverId', { nullable: true }) serverId: number,
  ) {
    if (!serverId) throw new GraphQLError('Server id is required');
    try {
      return this.serverService.updateServerWithNewInviteCode(serverId);
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => Server)
  async createChannel(
    @Args('input') input: CreateChannelOnServerDto,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.createChannel(input, ctx.req?.profile.email);
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => String)
  async leaveServer(
    @Args('serverId', { nullable: true }) serverId: number,
    @Context() ctx: { req: Request },
  ) {
    try {
      await this.serverService.leaveServer(serverId, ctx.req?.profile.email);
      return 'OK';
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => String)
  async deleteServer(
    @Args('serverId', { nullable: true }) serverId: number,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.deleteServer(serverId, ctx.req?.profile.email);
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => String)
  async deleteChannelFromServer(
    @Args('channelId', { nullable: true }) channelId: number,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.deleteChannelFromServer(
        channelId,
        ctx.req?.profile.email,
      );
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => Server)
  async addMemberToServer(
    @Args('inviteCode') inviteCode: string,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.addMemberToServer(
        inviteCode,
        ctx.req?.profile.email,
      );
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => Server)
  async changeMemberRole(
    @Args('memberId', { nullable: true }) memberId: number,
    @Args('role') role: MemberRole,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.changeMemberRole(
        memberId,
        role,
        ctx.req?.profile.email,
      );
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }

  @Mutation(() => Server)
  async deleteMember(
    @Args('memberId', { nullable: true }) memberId: number,
    @Context() ctx: { req: Request },
  ) {
    try {
      return this.serverService.deleteMember(memberId, ctx.req?.profile.email);
    } catch (err) {
      throw new GraphQLError(err.message);
    }
  }
}
