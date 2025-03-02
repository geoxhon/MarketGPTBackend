import { Test, TestingModule } from '@nestjs/testing';
import { TaskhandlerService } from './taskhandler.service';

describe('TaskhandlerService', () => {
  let service: TaskhandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskhandlerService],
    }).compile();

    service = module.get<TaskhandlerService>(TaskhandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
