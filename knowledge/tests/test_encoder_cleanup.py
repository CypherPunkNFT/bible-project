import unittest
from unittest.mock import Mock, patch
from knowledge.encoder import Encoder


class CleanupTests(unittest.TestCase):
    def test_cuda_failure_releases_lock_and_blocks_reuse(self):
        encoder = Encoder({})
        handle = encoder.gpu_lock = Mock()
        encoder.model = object()
        torch = Mock()
        torch.cuda.empty_cache.side_effect = RuntimeError('CUDA error: unspecified launch failure')
        with patch.dict('sys.modules', {'torch': torch}):
            encoder.unload()
        handle.close.assert_called_once()
        self.assertIsNone(encoder.model)
        self.assertIsNone(encoder.gpu_lock)
        with self.assertRaisesRegex(RuntimeError, 'requires restart'):
            encoder.load()

    def test_normal_cleanup_can_reload(self):
        encoder = Encoder({})
        encoder.gpu_lock = Mock()
        with patch.dict('sys.modules', {'torch': Mock()}):
            encoder.unload()
        self.assertIsNone(encoder.failure)


if __name__ == '__main__':unittest.main()
