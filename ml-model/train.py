"""
Train and tune a crop recommendation model with evaluation charts.
"""

import os
import pickle

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.preprocessing import LabelEncoder


def _save_accuracy_comparison_plot(model_scores, output_dir):
    """Save bar chart comparing cross-validation accuracy across baseline models."""
    plt.figure(figsize=(10, 6))
    names = list(model_scores.keys())
    scores = [model_scores[name] for name in names]

    sns.barplot(x=names, y=scores, palette="viridis")
    plt.ylim(0.9, 1.0)
    plt.ylabel("Mean CV Accuracy")
    plt.xlabel("Model")
    plt.title("Baseline Model Comparison (5-Fold CV)")

    for idx, score in enumerate(scores):
        plt.text(idx, score + 0.001, f"{score:.4f}", ha="center", fontsize=10)

    plt.tight_layout()
    plot_path = os.path.join(output_dir, "accuracy_comparison.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved chart: {plot_path}")


def _save_confusion_matrix_plot(y_true, y_pred, class_names, output_dir):
    """Save confusion matrix heatmap for tuned model predictions."""
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(14, 12))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.title("Confusion Matrix - Tuned Model")
    plt.xlabel("Predicted Label")
    plt.ylabel("True Label")
    plt.tight_layout()

    plot_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved chart: {plot_path}")


def _save_feature_importance_plot(model, feature_names, output_dir):
    """Save horizontal bar chart of feature importances."""
    importances = model.feature_importances_
    order = np.argsort(importances)

    plt.figure(figsize=(10, 6))
    plt.barh(np.array(feature_names)[order], importances[order], color="#2a9d8f")
    plt.title("Feature Importance - Tuned Model")
    plt.xlabel("Importance")
    plt.ylabel("Feature")
    plt.tight_layout()

    plot_path = os.path.join(output_dir, "feature_importance.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved chart: {plot_path}")


def _save_grid_search_results_plot(grid_search, output_dir):
    """Save sorted mean CV score chart from grid search trials."""
    cv_results = pd.DataFrame(grid_search.cv_results_)
    top_results = cv_results[["params", "mean_test_score"]].sort_values(
        by="mean_test_score", ascending=False
    )

    plt.figure(figsize=(12, 6))
    plt.plot(
        np.arange(1, len(top_results) + 1),
        top_results["mean_test_score"].values,
        marker="o",
        linestyle="-",
        color="#264653",
    )
    plt.title("Grid Search Scores (Sorted)")
    plt.xlabel("Configuration Rank")
    plt.ylabel("Mean CV Accuracy")
    plt.grid(alpha=0.25)
    plt.tight_layout()

    plot_path = os.path.join(output_dir, "grid_search_scores.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved chart: {plot_path}")


def _evaluate_baselines(X_train, y_train, cv):
    """Evaluate a small set of strong tree-based baselines."""
    candidates = {
        "RandomForest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            n_jobs=-1,
        ),
        "ExtraTrees": ExtraTreesClassifier(
            n_estimators=300,
            random_state=42,
            n_jobs=-1,
        ),
    }

    model_scores = {}
    for name, model in candidates.items():
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
        model_scores[name] = float(np.mean(scores))
        print(f"{name} CV Accuracy: {model_scores[name]:.4f} (+/- {np.std(scores):.4f})")

    best_name = max(model_scores, key=model_scores.get)
    print(f"\nBest baseline model: {best_name}")
    return best_name, model_scores

def train_model():
    """Train and tune the crop recommendation model, then save artifacts and charts."""

    sns.set_style("whitegrid")

    csv_path = os.path.join(os.path.dirname(__file__), '..', 'Crop_recommendation.csv')
    output_dir = os.path.join(os.path.dirname(__file__), "plots")
    os.makedirs(output_dir, exist_ok=True)

    print("Loading dataset...")
    df = pd.read_csv(csv_path)

    print(f"Dataset shape: {df.shape}")
    print(f"Unique crops: {df['label'].nunique()}")

    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df['label']

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded,
    )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    print("\nEvaluating baseline models...")
    best_model_name, model_scores = _evaluate_baselines(X_train, y_train, cv)
    _save_accuracy_comparison_plot(model_scores, output_dir)

    print(f"\nTuning {best_model_name} with GridSearchCV...")
    param_grid = {
        "n_estimators": [300, 500, 700],
        "max_depth": [None, 20, 30, 40],
        "min_samples_split": [2, 4, 6],
        "min_samples_leaf": [1, 2],
    }

    if best_model_name == "ExtraTrees":
        base_model = ExtraTreesClassifier(random_state=42, n_jobs=-1)
    else:
        base_model = RandomForestClassifier(random_state=42, n_jobs=-1)

    grid_search = GridSearchCV(
        estimator=base_model,
        param_grid=param_grid,
        scoring="accuracy",
        cv=cv,
        n_jobs=-1,
        verbose=1,
    )
    grid_search.fit(X_train, y_train)

    model = grid_search.best_estimator_
    print(f"Best params: {grid_search.best_params_}")
    print(f"Best CV accuracy: {grid_search.best_score_:.4f}")

    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)

    print(f"\nTraining Accuracy: {train_accuracy:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_test_pred,
            target_names=label_encoder.classes_,
            digits=4,
        )
    )

    _save_grid_search_results_plot(grid_search, output_dir)
    _save_confusion_matrix_plot(
        y_true=y_test,
        y_pred=y_test_pred,
        class_names=label_encoder.classes_,
        output_dir=output_dir,
    )
    _save_feature_importance_plot(
        model=model,
        feature_names=features,
        output_dir=output_dir,
    )

    model_path = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
    encoder_path = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nModel saved to: {model_path}")

    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"Label encoder saved to: {encoder_path}")

    return model, label_encoder

if __name__ == "__main__":
    train_model()
