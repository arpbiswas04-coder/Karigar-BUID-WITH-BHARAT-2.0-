import unittest
from dataclasses import replace
from app.services.trust_score_service import TrustInputs, calculate_trust
from app.services.evidence_scoring_service import temporal_change_score
class PhoneScoringTests(unittest.TestCase):
 def test_ordinary_phone_evidence_without_floor(self):
  base=TrustInputs(photo_decoded=True,photo_embedded=True,listing_completeness=1)
  self.assertEqual(calculate_trust(base).score,40)
  phone=replace(base,process_analyzed=True,average_visual_change=.06,frames_analyzed=8,hand_presence_ratio=.5,person_presence_ratio=.7,best_similarity=.5,average_similarity=.3,product_video_analyzed=True,product_video_average_similarity=.55,product_video_diversity=.7)
  report=calculate_trust(phone)
  self.assertGreaterEqual(report.score,80)
  self.assertLess(report.score,95)
  self.assertEqual(report.categories['craft_process_evidence'].score,18)
  missing=calculate_trust(replace(phone,best_similarity=None))
  self.assertEqual(missing.categories['product_process_match'].score,0)
  self.assertLess(missing.score,report.score)
 def test_temporal_plateau_and_stationary(self):
  for value in (.04,.1,.35,.6):self.assertEqual(temporal_change_score(value),1)
  self.assertEqual(temporal_change_score(0),0)
  self.assertLess(temporal_change_score(.9),1)
 def test_invalid_comparison_does_not_receive_baseline(self):
  with self.assertRaises(Exception):
   calculate_trust(TrustInputs(photo_embedded=True,process_analyzed=True,best_similarity=float('nan'),average_similarity=.5))
