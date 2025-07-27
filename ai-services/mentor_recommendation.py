import pandas as pd
import numpy as np
from scipy.spatial.distance import cdist
from typing import List, Dict, Any, Optional

def suggest_mentors(user_number: int, selected_subjects: List[str], user_data: pd.DataFrame, 
                   num_suggestions: int = 5, min_diff: float = 0.04, max_diff: float = 0.15) -> pd.DataFrame:
    """
    Enhanced mentor suggestion algorithm with improved scoring and filtering.
    
    Args:
        user_number: Index of the user seeking mentors
        selected_subjects: List of subjects for mentorship
        user_data: DataFrame containing user expertise data
        num_suggestions: Number of mentor suggestions to return
        min_diff: Minimum expertise difference required
        max_diff: Maximum expertise difference allowed
        
    Returns:
        DataFrame of suggested mentors with scores
    """
    
    if user_number < 0 or user_number >= len(user_data):
        raise ValueError("Invalid user number. Please select a valid number.")

    selected_user = user_data.iloc[user_number]
    selected_user_expertise = selected_user[selected_subjects].to_numpy()

    def is_mentor(candidate):
        """Check if a candidate can be a mentor based on expertise levels."""
        candidate_expertise = candidate[selected_subjects].to_numpy()
        differences = candidate_expertise - selected_user_expertise
        
        # Mentor should have higher expertise in at least one subject
        # and not be too far ahead in any subject
        has_higher_expertise = np.any(differences >= min_diff)
        not_too_advanced = np.all(differences <= max_diff)
        
        return has_higher_expertise and not_too_advanced

    # Filter potential mentors
    potential_mentors = user_data[user_data.apply(is_mentor, axis=1)].copy()
    
    # Remove the user themselves from suggestions
    potential_mentors = potential_mentors.drop(user_number, errors='ignore')

    if potential_mentors.empty:
        return pd.DataFrame([], columns=["User Name", "Similarity Score"] + selected_subjects)

    # Calculate similarity scores using cosine similarity
    selected_user_vector = selected_user[selected_subjects].to_numpy().reshape(1, -1)
    mentor_vectors = potential_mentors[selected_subjects].to_numpy()
    similarity_scores = 1 - cdist(selected_user_vector, mentor_vectors, metric="cosine")[0]
    
    # Add similarity scores to the dataframe
    potential_mentors["Similarity Score"] = similarity_scores
    
    # Calculate mentor quality score
    potential_mentors["Mentor Score"] = calculate_mentor_score(
        potential_mentors, selected_user, selected_subjects
    )
    
    # Sort by mentor score (combination of expertise difference and other factors)
    potential_mentors = potential_mentors.sort_values(by="Mentor Score", ascending=False)
    
    # Return top suggestions
    return potential_mentors.head(num_suggestions)


def calculate_mentor_score(mentors_df: pd.DataFrame, user: pd.Series, subjects: List[str]) -> pd.Series:
    """
    Calculate a comprehensive mentor score based on multiple factors.
    
    Args:
        mentors_df: DataFrame of potential mentors
        user: Series representing the user seeking mentorship
        subjects: List of subjects for mentorship
        
    Returns:
        Series of mentor scores
    """
    
    scores = pd.Series(index=mentors_df.index, dtype=float)
    
    for idx, mentor in mentors_df.iterrows():
        score = 0.0
        
        # 1. Expertise advantage (40% weight)
        user_expertise = user[subjects].to_numpy()
        mentor_expertise = mentor[subjects].to_numpy()
        expertise_diff = mentor_expertise - user_expertise
        
        # Reward mentors who are ahead but not too far
        for diff in expertise_diff:
            if 0.05 <= diff <= 0.12:  # Sweet spot for mentorship
                score += diff * 100  # Scale the difference
            elif diff > 0:
                score += min(diff * 50, 10)  # Diminishing returns for very high expertise
        
        # 2. Overall expertise level (20% weight)
        mentor_avg_expertise = mentor[subjects].mean()
        if mentor_avg_expertise >= 0.7:  # High overall expertise
            score += 20
        elif mentor_avg_expertise >= 0.5:
            score += 10
        
        # 3. Breadth of expertise (15% weight)
        # Mentors with knowledge in multiple subjects are valuable
        high_expertise_subjects = sum(mentor[subjects] >= 0.6)
        score += high_expertise_subjects * 3
        
        # 4. Complementary skills (15% weight)
        # Check if mentor has skills the user lacks
        user_weak_subjects = [s for s in subjects if user[s] < 0.4]
        mentor_strong_in_weak = sum(mentor[s] >= 0.6 for s in user_weak_subjects)
        score += mentor_strong_in_weak * 5
        
        # 5. Similarity bonus (10% weight)
        # Some similarity helps with communication and understanding
        similarity = 1 - cdist(
            user[subjects].to_numpy().reshape(1, -1),
            mentor[subjects].to_numpy().reshape(1, -1),
            metric="cosine"
        )[0][0]
        
        if 0.3 <= similarity <= 0.8:  # Not too similar, not too different
            score += similarity * 10
        
        scores[idx] = score
    
    return scores


def find_study_groups(user_number: int, subjects: List[str], user_data: pd.DataFrame,
                     group_size: int = 4, similarity_threshold: float = 0.3) -> List[List[int]]:
    """
    Find study groups of users with similar expertise levels.
    
    Args:
        user_number: Index of the user
        subjects: Subjects to consider for grouping
        user_data: DataFrame containing user data
        group_size: Desired size of study groups
        similarity_threshold: Minimum similarity for group membership
        
    Returns:
        List of study groups (each group is a list of user indices)
    """
    
    if user_number < 0 or user_number >= len(user_data):
        raise ValueError("Invalid user number.")
    
    user = user_data.iloc[user_number]
    user_expertise = user[subjects].to_numpy()
    
    # Find users with similar expertise levels
    similar_users = []
    
    for idx, other_user in user_data.iterrows():
        if idx == user_number:
            continue
            
        other_expertise = other_user[subjects].to_numpy()
        
        # Calculate similarity
        similarity = 1 - cdist(
            user_expertise.reshape(1, -1),
            other_expertise.reshape(1, -1),
            metric="cosine"
        )[0][0]
        
        # Check if expertise levels are close enough for effective collaboration
        expertise_diff = np.abs(user_expertise - other_expertise)
        if similarity >= similarity_threshold and np.all(expertise_diff <= 0.2):
            similar_users.append((idx, similarity))
    
    # Sort by similarity and create groups
    similar_users.sort(key=lambda x: x[1], reverse=True)
    
    groups = []
    remaining_users = [user_number] + [user_id for user_id, _ in similar_users]
    
    while len(remaining_users) >= group_size:
        group = remaining_users[:group_size]
        groups.append(group)
        remaining_users = remaining_users[group_size:]
    
    # Add remaining users to the last group if it exists
    if groups and remaining_users:
        groups[-1].extend(remaining_users)
    
    return groups


def get_learning_path_mentors(user_expertise: Dict[str, float], target_expertise: Dict[str, float],
                             user_data: pd.DataFrame, subjects: List[str]) -> List[int]:
    """
    Find mentors for a specific learning path from current to target expertise.
    
    Args:
        user_expertise: Current expertise levels
        target_expertise: Desired expertise levels
        user_data: DataFrame containing user data
        subjects: Subjects to consider
        
    Returns:
        List of mentor user indices for the learning path
    """
    
    path_mentors = []
    
    for subject in subjects:
        current_level = user_expertise.get(subject, 0)
        target_level = target_expertise.get(subject, 0)
        
        if target_level <= current_level:
            continue  # No mentorship needed for this subject
        
        # Find mentors at intermediate levels between current and target
        intermediate_levels = np.linspace(current_level, target_level, num=5)[1:-1]
        
        for level in intermediate_levels:
            # Find users close to this intermediate level
            suitable_mentors = []
            
            for idx, user in user_data.iterrows():
                user_level = user.get(subject, 0)
                if abs(user_level - level) <= 0.1 and user_level > current_level:
                    suitable_mentors.append(idx)
            
            if suitable_mentors:
                # Pick the best mentor for this level
                best_mentor = max(suitable_mentors, 
                                key=lambda x: user_data.iloc[x][subject])
                path_mentors.append(best_mentor)
    
    return list(set(path_mentors))  # Remove duplicates


def analyze_mentorship_network(user_data: pd.DataFrame, subjects: List[str]) -> Dict[str, Any]:
    """
    Analyze the mentorship network structure in the user base.
    
    Args:
        user_data: DataFrame containing user expertise data
        subjects: Subjects to analyze
        
    Returns:
        Dictionary with network analysis results
    """
    
    total_users = len(user_data)
    mentorship_pairs = 0
    subject_coverage = {}
    
    # Analyze potential mentorship pairs
    for i in range(total_users):
        for j in range(total_users):
            if i == j:
                continue
                
            user_i = user_data.iloc[i]
            user_j = user_data.iloc[j]
            
            # Check if user_j can mentor user_i
            can_mentor = False
            for subject in subjects:
                if user_j[subject] > user_i[subject] + 0.05:  # Minimum expertise gap
                    can_mentor = True
                    break
            
            if can_mentor:
                mentorship_pairs += 1
                
                # Track subject coverage
                for subject in subjects:
                    if user_j[subject] > user_i[subject] + 0.05:
                        if subject not in subject_coverage:
                            subject_coverage[subject] = 0
                        subject_coverage[subject] += 1
    
    # Calculate network metrics
    avg_mentorship_options = mentorship_pairs / total_users if total_users > 0 else 0
    
    # Find expertise distribution
    expertise_stats = {}
    for subject in subjects:
        subject_expertise = user_data[subject].values
        expertise_stats[subject] = {
            'mean': np.mean(subject_expertise),
            'std': np.std(subject_expertise),
            'min': np.min(subject_expertise),
            'max': np.max(subject_expertise),
            'expertise_levels': {
                'beginner': sum(subject_expertise < 0.3),
                'intermediate': sum((subject_expertise >= 0.3) & (subject_expertise < 0.7)),
                'advanced': sum(subject_expertise >= 0.7)
            }
        }
    
    return {
        'total_users': total_users,
        'total_mentorship_pairs': mentorship_pairs,
        'avg_mentorship_options_per_user': avg_mentorship_options,
        'subject_coverage': subject_coverage,
        'expertise_statistics': expertise_stats,
        'network_density': mentorship_pairs / (total_users * (total_users - 1)) if total_users > 1 else 0
    }
