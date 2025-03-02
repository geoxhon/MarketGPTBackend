import { Test, TestingModule } from '@nestjs/testing';
import { SkroutzService } from './skroutz.service';

describe('SkroutzService', () => {
  let service: SkroutzService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkroutzService],
    }).compile();

    service = module.get<SkroutzService>(SkroutzService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
