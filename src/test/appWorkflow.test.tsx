import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../app/App';

function createMockPngFile(name = 'design-preview.png'): File {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return new File([bytes], name, { type: 'image/png' });
}

describe('End-to-End Studio UI Workflow (Commissions 1 to 5 + Shop + Portfolio + Reset)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('supports complete progression from initial greeting to Commission 5 Grand Finale, cosmetic shop, portfolio, and clean reset', async () => {
    const { unmount } = render(<App />);

    // 1. Fresh state check
    expect(screen.getByTestId('active-commission-title')).toHaveTextContent(
      'My First Room'
    );
    expect(screen.getByTestId('architect-rank')).toHaveTextContent(
      'Apprentice Architect'
    );
    expect(screen.getByTestId('personal-wallet-balance')).toHaveTextContent(
      '0 coins'
    );
    expect(screen.getByTestId('mr-rabbit-portrait')).toHaveAttribute(
      'data-expression',
      'greeting'
    );
    expect(screen.getByTestId('architecture-workspace-empty')).toBeInTheDocument();

    // Check sealed commissions 2-5 in roadmap
    fireEvent.click(screen.getByTestId('open-commissions-btn'));
    expect(screen.getByTestId('commission-locked-2')).toBeInTheDocument();
    expect(screen.getByTestId('commission-locked-5')).toBeInTheDocument();
    expect(screen.queryByText('How Do I Get Inside?')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // 2. Deliver Commission 1 -> Request Revision -> Redeliver -> Approve
    fireEvent.click(screen.getByTestId('deliver-design-btn'));
    const fileInput1 = screen.getByTestId('delivery-file-input');
    fireEvent.change(fileInput1, {
      target: { files: [createMockPngFile('room-v1.png')] },
    });
    await screen.findByAltText('Design submission preview');
    fireEvent.change(screen.getByLabelText(/Project Title/i), {
      target: { value: 'Meadow Room Plan v1' },
    });
    fireEvent.change(screen.getByLabelText(/Reported Construction Cost/i), {
      target: { value: '750' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-delivery-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('commission-status-badge')).toHaveTextContent(
        'Design submitted'
      );
    });

    // Open Teacher Controls & request constructive revision
    fireEvent.click(screen.getByTestId('open-teacher-controls-btn'));
    fireEvent.click(screen.getByTestId('confirm-enter-teacher-btn'));
    fireEvent.change(screen.getByTestId('teacher-revision-custom-input'), {
      target: { value: 'Please make the 4m x 5m dimensions extra clear!' },
    });
    fireEvent.click(screen.getByTestId('teacher-request-revision-btn'));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByTestId('commission-status-badge')).toHaveTextContent(
      'Revision requested'
    );
    fireEvent.click(screen.getByTestId('customer-speech-bubble'));
    expect(screen.getByTestId('customer-speech-bubble')).toHaveTextContent(
      '4m x 5m dimensions extra clear'
    );

    // Redeliver & approve Commissions 1..5
    const commissionTitles = [
      'My First Room',
      'How Do I Get Inside?',
      'Bring It to Life',
      'Make It Beautiful',
      'My Wonderful Home',
    ];

    for (let idx = 0; idx < 5; idx += 1) {
      expect(screen.getByTestId('active-commission-title')).toHaveTextContent(
        commissionTitles[idx]
      );

      fireEvent.click(screen.getByTestId('deliver-design-btn'));
      const fileInput = screen.getByTestId('delivery-file-input');
      fireEvent.change(fileInput, {
        target: { files: [createMockPngFile(`commission-${idx + 1}.png`)] },
      });
      await screen.findByAltText('Design submission preview');
      fireEvent.change(screen.getByLabelText(/Project Title/i), {
        target: { value: `Submission ${idx + 1}` },
      });
      fireEvent.change(screen.getByLabelText(/Reported Construction Cost/i), {
        target: { value: String(600 + idx * 200) },
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-delivery-confirm'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('commission-status-badge')).toHaveTextContent(
          'Design submitted'
        );
      });

      fireEvent.click(screen.getByTestId('open-teacher-controls-btn'));
      fireEvent.click(screen.getByTestId('confirm-enter-teacher-btn'));
      fireEvent.click(screen.getByTestId('teacher-approve-btn'));

      const celebration = screen.getByTestId('celebration-modal');
      expect(celebration).toBeInTheDocument();

      if (idx < 4) {
        fireEvent.click(screen.getByTestId('celebration-accept-next'));
      } else {
        expect(celebration).toHaveTextContent('Master Architect & Studio Creator');
        fireEvent.click(screen.getByTestId('celebration-keep-exploring'));
      }
    }

    // Verify Master Architect & 2,000 coins
    expect(screen.getByTestId('architect-rank')).toHaveTextContent(
      'Master Architect'
    );
    expect(screen.getByTestId('personal-wallet-balance')).toHaveTextContent(
      '2,000 coins'
    );

    // 3. Visit Reward Shop: buy & equip Rabbit Bow Tie + Starry Studio Theme
    fireEvent.click(screen.getByTestId('nav-tab-shop'));
    fireEvent.click(screen.getByTestId('buy-item-rabbit-bow-tie'));
    fireEvent.click(screen.getByTestId('buy-item-starry-studio-theme'));
    expect(screen.getByTestId('shop-wallet-balance')).toHaveTextContent(
      '1,750 coins'
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('starry');

    fireEvent.click(screen.getByTestId('nav-tab-studio'));
    expect(screen.getByTestId('cosmetic-bow-tie')).toBeInTheDocument();

    // 4. Visit Portfolio & check all 5 permanent entries
    fireEvent.click(screen.getByTestId('nav-tab-portfolio'));
    expect(screen.getByTestId('portfolio-entry-1')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-entry-5')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('open-presentation-mode-btn'));
    expect(screen.getByTestId('portfolio-presentation-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    // 5. Simulate page reload and verify state persists
    unmount();
    render(<App />);
    expect(screen.getByTestId('architect-rank')).toHaveTextContent(
      'Master Architect'
    );
    expect(screen.getByTestId('personal-wallet-balance')).toHaveTextContent(
      '1,750 coins'
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('starry');

    // 6. Reset cleanly via Teacher Controls
    fireEvent.click(screen.getByTestId('open-teacher-controls-btn'));
    fireEvent.click(screen.getByTestId('confirm-enter-teacher-btn'));
    fireEvent.click(screen.getByTestId('teacher-tab-backup'));
    fireEvent.change(screen.getByTestId('teacher-reset-phrase-input'), {
      target: { value: 'RESET' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('teacher-reset-confirm-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('active-commission-title')).toHaveTextContent(
        'My First Room'
      );
    });
    expect(screen.getByTestId('personal-wallet-balance')).toHaveTextContent(
      '0 coins'
    );
    expect(screen.getByTestId('architect-rank')).toHaveTextContent(
      'Apprentice Architect'
    );
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
