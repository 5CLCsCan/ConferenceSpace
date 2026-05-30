#!/usr/bin/env python3
"""
Seed script for manual testing of the suggestions workflow.
Creates: 1 chair, 10 authors, 15 reviewers, 1 conference, 10 submissions
"""

import requests
import json
import sys
from dataclasses import dataclass
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"

# Colors for terminal output
class Colors:
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    NC = "\033[0m"  # No Color


@dataclass
class User:
    id: int
    email: str
    token: Optional[str] = None


def print_step(step_num: int, message: str):
    print(f"\n{Colors.YELLOW}Step {step_num}: {message}{Colors.NC}")


def print_success(message: str):
    print(f"{Colors.GREEN}✓{Colors.NC} {message}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}!{Colors.NC} {message}")


def print_error(message: str):
    print(f"{Colors.RED}✗{Colors.NC} {message}")


def register_user(email: str, first_name: str, last_name: str, domains: list[str]) -> Optional[User]:
    """Register a new user or return existing user info."""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "user": {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "domain": domains,
                },
                "password": PASSWORD,
            },
        )

        if response.status_code == 201:
            data = response.json()
            user_id = data.get("data", {}).get("id") or data.get("id")
            print_success(f"Registered user: {email} (ID: {user_id})")
            return User(id=user_id, email=email)
        elif "already exists" in response.text.lower() or "duplicate key" in response.text.lower():
            print_warning(f"User already exists: {email}, logging in...")
            return login_user(email)
        else:
            print_error(f"Failed to register {email}: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error registering {email}: {e}")
        return None


def login_user(email: str) -> Optional[User]:
    """Login a user and return user info with token."""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": email, "password": PASSWORD},
        )

        if response.status_code == 200:
            data = response.json().get("data", response.json())
            token = data.get("token")
            user_data = data.get("user", {})
            user_id = user_data.get("id")
            return User(id=user_id, email=email, token=token)
        else:
            print_error(f"Failed to login {email}: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error logging in {email}: {e}")
        return None


def find_conference_by_acronym(token: str, acronym: str) -> Optional[int]:
    """Find an existing conference by acronym."""
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/conferences?acronym={acronym}&limit=1",
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code == 200:
            data = response.json().get("data", response.json())
            conferences = data.get("conferences", [])
            if conferences:
                return conferences[0].get("id")
        return None
    except Exception:
        return None


def create_conference(chair_token: str, chair_email: str) -> Optional[int]:
    """Create a test conference or return existing one."""
    acronym = "TCMAT2026"

    # Check if conference already exists
    existing_id = find_conference_by_acronym(chair_token, acronym)
    if existing_id:
        print_warning(f"Conference {acronym} already exists (ID: {existing_id})")
        return existing_id

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/conferences",
            headers={"Authorization": f"Bearer {chair_token}"},
            json={
                "conference": {
                    "title": "Test Conference for Manual Assignment Testing",
                    "acronym": acronym,
                    "description": "A test conference to verify the manual assignment suggestions workflow",
                    "chair": chair_email,
                    "domain": ["AI", "ML", "NLP", "Computer Vision", "Deep Learning"],
                    "tracks": ["Main Track", "Industry Track", "Workshop"],
                    "venue": "Virtual",
                }
            },
        )

        if response.status_code in [200, 201]:
            data = response.json().get("data", response.json())
            conf_id = data.get("id")
            print_success(f"Created conference: {acronym} (ID: {conf_id})")
            return conf_id
        elif "duplicate" in response.text.lower():
            # Try to find existing conference
            existing_id = find_conference_by_acronym(chair_token, acronym)
            if existing_id:
                print_warning(f"Conference {acronym} already exists (ID: {existing_id})")
                return existing_id
            print_error(f"Conference exists but couldn't find it: {response.text}")
            return None
        else:
            print_error(f"Failed to create conference: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error creating conference: {e}")
        return None


def add_reviewers(conference_id: int, chair_token: str, reviewers: list[User], reviewer_domains: list[list[str]]):
    """Add reviewers to the conference."""
    reviewers_data = []
    for i, reviewer in enumerate(reviewers):
        if reviewer and reviewer.id:
            reviewers_data.append({
                "user_id": reviewer.id,
                "domain": reviewer_domains[i] if i < len(reviewer_domains) else ["AI"],
            })

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/conferences/{conference_id}/reviewers",
            headers={"Authorization": f"Bearer {chair_token}"},
            json={"reviewers": reviewers_data},
        )

        if response.status_code in [200, 201]:
            print_success(f"Added {len(reviewers_data)} reviewers to conference")
            return True
        else:
            print_error(f"Failed to add reviewers: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error adding reviewers: {e}")
        return False


def accept_reviewer_invitations(conference_id: int, chair_token: str):
    """Accept all reviewer invitations."""
    try:
        # Get list of reviewers
        response = requests.get(
            f"{BASE_URL}/api/v1/conferences/{conference_id}/reviewers?limit=20",
            headers={"Authorization": f"Bearer {chair_token}"},
        )

        if response.status_code != 200:
            print_error(f"Failed to get reviewers list: {response.text}")
            return

        data = response.json().get("data", response.json())
        reviewers = data.get("reviewers", [])

        # Accept each invitation
        for reviewer in reviewers:
            reviewer_id = reviewer.get("id")
            if reviewer_id:
                accept_response = requests.put(
                    f"{BASE_URL}/api/v1/conferences/{conference_id}/reviewers/{reviewer_id}/status",
                    headers={"Authorization": f"Bearer {chair_token}"},
                    json={"status": "accepted"},
                )
                if accept_response.status_code == 200:
                    print_success(f"Accepted reviewer invitation (ID: {reviewer_id})")
                else:
                    print_warning(f"Could not accept reviewer {reviewer_id}: {accept_response.text}")

    except Exception as e:
        print_error(f"Error accepting invitations: {e}")


def create_dummy_pdf() -> bytes:
    """Create a minimal valid PDF file for testing."""
    # A minimal valid PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Paper) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF"""
    return pdf_content


def create_submission(conference_id: int, author_token: str, title: str, abstract: str,
                      domains: list[str], keywords: list[str], track: str) -> Optional[int]:
    """Create and publish a submission using multipart/form-data."""
    try:
        # Create submission data wrapped in "submission" key
        submission_wrapper = {
            "submission": {
                "title": title,
                "abstract": abstract,
                "domain": domains,
                "track": track,
                "status": "draft",
                "information": {
                    "keywords": keywords,
                    "paper_type": "Full Paper",
                    "track_name": track,
                },
            }
        }

        # Create a dummy PDF file for the submission
        pdf_content = create_dummy_pdf()

        # Use multipart/form-data with actual file to ensure proper encoding
        response = requests.post(
            f"{BASE_URL}/api/v1/conferences/{conference_id}/submissions",
            headers={"Authorization": f"Bearer {author_token}"},
            data={"submission": json.dumps(submission_wrapper)},
            files={"file": ("paper.pdf", pdf_content, "application/pdf")},
        )

        if response.status_code not in [200, 201]:
            print_error(f"Failed to create submission: {response.text}")
            return None

        data = response.json().get("data", response.json())
        submission_id = data.get("id")
        print_success(f"Created submission: {title[:50]}... (ID: {submission_id})")

        # Publish the submission
        publish_response = requests.put(
            f"{BASE_URL}/api/v1/conferences/{conference_id}/submissions/{submission_id}/status",
            headers={"Authorization": f"Bearer {author_token}"},
            json={"status": "published"},
        )

        if publish_response.status_code == 200:
            print(f"  {Colors.GREEN}→{Colors.NC} Published submission {submission_id}")
        else:
            print_warning(f"Could not publish submission: {publish_response.text}")

        return submission_id

    except Exception as e:
        print_error(f"Error creating submission: {e}")
        return None


def main():
    print(f"{Colors.YELLOW}=== Seeding Test Data for Suggestions Workflow ==={Colors.NC}")
    print(f"Base URL: {BASE_URL}")

    # Domain configurations
    author_domains = [
        ["AI", "Machine Learning"],
        ["NLP", "Text Mining"],
        ["Computer Vision", "Deep Learning"],
        ["Data Science", "AI"],
        ["ML", "Neural Networks"],
        ["NLP", "AI"],
        ["Computer Vision", "ML"],
        ["Deep Learning", "AI"],
        ["Data Mining", "ML"],
        ["AI", "Robotics"],
    ]

    reviewer_domains = [
        ["AI", "ML", "Deep Learning"],
        ["NLP", "Text Mining", "AI"],
        ["Computer Vision", "Image Processing"],
        ["ML", "Data Science"],
        ["Neural Networks", "Deep Learning"],
        ["NLP", "Sentiment Analysis"],
        ["AI", "Robotics"],
        ["ML", "Statistics"],
        ["Computer Vision", "Object Detection"],
        ["Deep Learning", "Generative Models"],
        ["NLP", "Machine Translation"],
        ["AI", "Knowledge Graphs"],
        ["ML", "Reinforcement Learning"],
        ["Computer Vision", "Segmentation"],
        ["AI", "ML", "NLP"],
    ]

    paper_data = [
        {
            "title": "Deep Learning Approaches for Natural Language Understanding",
            "abstract": "This paper presents novel deep learning approaches for natural language understanding tasks. We propose a hybrid architecture combining attention mechanisms with recurrent neural networks.",
            "keywords": ["Deep Learning", "NLP", "Attention Mechanisms"],
            "track": "Main Track",
        },
        {
            "title": "A Survey of Computer Vision Techniques in Autonomous Driving",
            "abstract": "A comprehensive survey of computer vision techniques used in autonomous driving systems. We review object detection, lane detection, and depth estimation methods.",
            "keywords": ["Computer Vision", "Autonomous Driving", "Object Detection"],
            "track": "Main Track",
        },
        {
            "title": "Efficient Neural Network Architectures for Mobile Devices",
            "abstract": "We introduce efficient neural network architectures designed for deployment on mobile and edge devices. Our models achieve state-of-the-art accuracy with reduced computational cost.",
            "keywords": ["Neural Networks", "Mobile Computing", "Efficiency"],
            "track": "Industry Track",
        },
        {
            "title": "Sentiment Analysis Using Transformer Models",
            "abstract": "This work explores the application of transformer models for sentiment analysis. We fine-tune pre-trained language models on multiple sentiment classification datasets.",
            "keywords": ["Sentiment Analysis", "Transformers", "NLP"],
            "track": "Main Track",
        },
        {
            "title": "Object Detection in Real-Time Video Streams",
            "abstract": "A real-time object detection system for video streams is presented. Our method achieves high accuracy while maintaining low latency for real-time applications.",
            "keywords": ["Object Detection", "Video Processing", "Real-Time"],
            "track": "Industry Track",
        },
        {
            "title": "Generative Adversarial Networks for Image Synthesis",
            "abstract": "We propose novel generative adversarial network architectures for high-quality image synthesis. Our approach generates photorealistic images from random noise.",
            "keywords": ["GANs", "Image Synthesis", "Deep Learning"],
            "track": "Workshop",
        },
        {
            "title": "Knowledge Graph Embedding Methods: A Comparative Study",
            "abstract": "A comparative study of knowledge graph embedding methods is presented. We evaluate various approaches on link prediction and entity classification tasks.",
            "keywords": ["Knowledge Graphs", "Embeddings", "Link Prediction"],
            "track": "Main Track",
        },
        {
            "title": "Reinforcement Learning for Game Playing Agents",
            "abstract": "This paper develops reinforcement learning algorithms for game playing agents. We demonstrate performance exceeding human experts on several challenging games.",
            "keywords": ["Reinforcement Learning", "Game AI", "Deep Q-Learning"],
            "track": "Main Track",
        },
        {
            "title": "Multi-Modal Learning for Visual Question Answering",
            "abstract": "Multi-modal learning approaches for visual question answering are explored. Our model effectively combines visual and textual information for accurate answers.",
            "keywords": ["Multi-Modal", "VQA", "Vision-Language"],
            "track": "Workshop",
        },
        {
            "title": "Federated Learning: Privacy-Preserving Machine Learning",
            "abstract": "We present a federated learning framework that enables privacy-preserving machine learning across distributed devices without sharing raw data.",
            "keywords": ["Federated Learning", "Privacy", "Distributed ML"],
            "track": "Industry Track",
        },
    ]

    # Step 1: Create chair user
    print_step(1, "Creating chair user...")
    chair = register_user("dcao_chair_1@test.com", "Chair", "One", ["AI", "ML", "NLP", "Computer Vision"])
    if not chair:
        print_error("Failed to create chair. Exiting.")
        sys.exit(1)

    chair = login_user("dcao_chair_1@test.com")
    if not chair or not chair.token:
        print_error("Failed to login as chair. Exiting.")
        sys.exit(1)
    print_success("Chair token obtained")

    # Step 2: Create author users
    print_step(2, "Creating 10 author users...")
    authors: list[Optional[User]] = []
    for i in range(1, 11):
        author = register_user(
            f"dcao_author_{i}@test.com",
            "Author",
            str(i),
            author_domains[i - 1],
        )
        if author:
            author = login_user(author.email)
        authors.append(author)

    # Step 3: Create reviewer users
    print_step(3, "Creating 15 reviewer users...")
    reviewers: list[Optional[User]] = []
    for i in range(1, 16):
        reviewer = register_user(
            f"dcao_reviewer_{i}@test.com",
            "Reviewer",
            str(i),
            reviewer_domains[i - 1],
        )
        reviewers.append(reviewer)

    # Step 4: Create conference
    print_step(4, "Creating conference...")
    conference_id = create_conference(chair.token, chair.email)
    if not conference_id:
        print_error("Failed to create conference. Exiting.")
        sys.exit(1)

    # Step 5: Add reviewers to conference
    print_step(5, "Adding 15 reviewers to conference...")
    add_reviewers(conference_id, chair.token, [r for r in reviewers if r], reviewer_domains)

    # Step 6: Accept all reviewer invitations
    print_step(6, "Accepting all reviewer invitations...")
    accept_reviewer_invitations(conference_id, chair.token)

    # Step 7: Create 10 submissions
    print_step(7, "Creating 10 submissions...")
    for i, author in enumerate(authors):
        if author and author.token:
            paper = paper_data[i]
            create_submission(
                conference_id,
                author.token,
                paper["title"],
                paper["abstract"],
                author_domains[i],
                paper["keywords"],
                paper["track"],
            )
        else:
            print_warning(f"Skipping submission {i + 1} - no author token")

    # Print summary
    print(f"\n{Colors.YELLOW}=== Seed Data Summary ==={Colors.NC}")
    print(f"Conference ID: {Colors.GREEN}{conference_id}{Colors.NC}")
    print(f"Chair: dcao_chair_1@test.com (password: {PASSWORD})")
    print("Authors: dcao_author_1@test.com to dcao_author_10@test.com")
    print("Reviewers: dcao_reviewer_1@test.com to dcao_reviewer_15@test.com")
    print("Submissions: 10 published papers")
    print()
    print(f"{Colors.YELLOW}To test the manual assignment workflow:{Colors.NC}")
    print("1. Login as chair (dcao_chair_1@test.com)")
    print(f"2. Go to conference detail page: /role/chair/conferences/{conference_id}")
    print("3. Click 'Auto-Assign Reviewers' to create suggestions")
    print("4. Navigate to 'Assignments' tab to view and manage suggestions")
    print("5. Confirm individual assignments or confirm all")
    print()
    print(f"{Colors.GREEN}Seed data created successfully!{Colors.NC}")


if __name__ == "__main__":
    main()
