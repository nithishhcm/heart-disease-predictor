import io
import matplotlib
# Use non-interactive backend for headless environments
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

def generate_gauge(value: float, label: str = "Probability") -> bytes:
    """Generates an HSL-matching gauge plot (0.0 to 1.0) and returns PNG bytes."""
    fig, ax = plt.subplots(figsize=(4, 2.5), subplot_kw={'projection': 'polar'})
    fig.patch.set_facecolor('#050505')
    ax.set_facecolor('#050505')
    
    # Gauge values
    val_deg = value * 180  # Convert 0-1 to 0-180 deg
    val_rad = np.deg2rad(180 - val_deg) # Invert for left-to-right polar
    
    # Draw background arc
    theta = np.linspace(0, np.pi, 100)
    ax.plot(theta, [1]*100, color='#262626', lw=15)
    
    # Determine color color based on value
    if value > 0.7:
        fill_color = '#ef4444' # Red
    elif value > 0.4:
        fill_color = '#f97316' # Orange
    else:
        fill_color = '#00f0ff' # Cyan
        
    # Draw value arc
    theta_val = np.linspace(np.pi - val_rad, np.pi, 100)
    ax.plot(theta_val, [1]*100, color=fill_color, lw=15)
    
    # Draw pointer needle
    ax.annotate(
        '', xy=(np.pi - val_rad, 1.0), xytext=(0, 0),
        arrowprops=dict(arrowstyle="->", color='#ffffff', lw=3, mutation_scale=15)
    )
    
    # Hide polar grid
    ax.set_yticklabels([])
    ax.set_xticklabels([])
    ax.grid(False)
    ax.spines['polar'].set_visible(False)
    
    # Add text label
    pct = round(value * 100, 1)
    ax.text(
        0, 0, f"{pct}%", 
        color='#ffffff', fontsize=18, fontweight='bold',
        va='center', ha='center'
    )
    ax.text(
        0, -0.4, label.upper(), 
        color='#a3a3a3', fontsize=8, fontweight='semibold',
        va='center', ha='center'
    )
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', dpi=150)
    plt.close(fig)
    return buf.getvalue()

def generate_shap_bar(shap_values: dict, limit: int = 6) -> bytes:
    """Generates a horizontal bar chart of SHAP factors, colored by risk direction."""
    # Sort and slice
    sorted_items = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:limit]
    features = [item[0].upper() for item in sorted_items][::-1]
    impacts = [item[1] for item in sorted_items][::-1]
    
    fig, ax = plt.subplots(figsize=(5, 3))
    fig.patch.set_facecolor('#050505')
    ax.set_facecolor('#050505')
    
    colors = ['#ef4444' if v > 0 else '#00f0ff' for v in impacts]
    
    bars = ax.barh(features, impacts, color=colors, height=0.6)
    
    # Style grid
    ax.axvline(0, color='#ffffff', lw=0.8, ls='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#262626')
    ax.spines['bottom'].set_color('#262626')
    ax.tick_params(colors='#a3a3a3', labelsize=8)
    ax.xaxis.grid(True, color='#1f1f1f', ls=':', lw=0.5)
    ax.set_title("FACTOR INFERENCE IMPACT (SHAP)", color='#ffffff', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', dpi=150)
    plt.close(fig)
    return buf.getvalue()

def generate_trend_line(probabilities: list, dates: list) -> bytes:
    """Generates a cardiac event risk timeline and returns PNG bytes."""
    fig, ax = plt.subplots(figsize=(5, 2.5))
    fig.patch.set_facecolor('#050505')
    ax.set_facecolor('#050505')
    
    y_vals = [p * 100 for p in probabilities]
    x_labels = [d.strftime("%m/%d %H:%M") if hasattr(d, "strftime") else str(d) for d in dates]
    
    ax.plot(x_labels, y_vals, marker='o', color='#7000ff', lw=2, mfc='#00f0ff', mec='#ffffff')
    ax.fill_between(x_labels, y_vals, color='#7000ff', alpha=0.15)
    
    ax.set_ylim(0, 105)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#262626')
    ax.spines['bottom'].set_color('#262626')
    ax.tick_params(colors='#a3a3a3', labelsize=8)
    ax.yaxis.grid(True, color='#1f1f1f', ls=':', lw=0.5)
    ax.set_title("CARDIOVASCULAR INFERENCE TREND", color='#ffffff', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', dpi=150)
    plt.close(fig)
    return buf.getvalue()
